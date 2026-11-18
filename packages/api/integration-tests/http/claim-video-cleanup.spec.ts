import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import { CLAIM_VIDEO_RETENTION_MS } from "../../src/workflows/steps/claim"
import deleteClaimVideos from "../../src/jobs/delete-claim-videos"

jest.setTimeout(120 * 1000)

// US-061 T-061.1 (AC1, D-018, D-027, D-038, D-058): the daily cleanup job
// deletes the private video of a claim closed more than 30 days ago
// (`confirmed` by `confirmed_at`, `rejected` by `decided_at`) and sets
// `video_deleted_at`; the claim row stays, `has_video` flips to false on the
// three read surfaces, a re-run changes nothing, a missing file or one failed
// row does not stop the batch, and no money moves.

const DAY = 24 * 60 * 60 * 1000
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-claim-cleanup")

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "customer" | "user"
) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type,
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string
    let admin: Record<string, string>

    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const fileModule = () => getContainer().resolve(Modules.FILE)

    const fileExists = async (key: string) => {
      try {
        await fileModule().getAsBuffer(key)
        return true
      } catch {
        return false
      }
    }

    // A farmer as US-020 leaves one (customer + member + seller).
    const registerFarm = async () => {
      const container = getContainer()
      const email = `claim-cleanup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email,
            currency_code: "idr",
          },
        },
      })
      const signIn = await api.post("/auth/member/emailpass", { email, password })
      return {
        seller,
        vendor: {
          authorization: `Bearer ${signIn.data.token}`,
          "x-seller-id": seller.id,
        },
      }
    }

    const winner = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `claim-cleanup-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: "Siti",
          last_name: "Rahmawati",
        },
      ])
      return {
        id: row.id,
        headers: {
          authorization: `Bearer ${jwt(container, row.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    // A `delivered` lot under the winner, as US-053 leaves one.
    const lot = async (sellerId: string, winnerId: string) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: sellerId,
          fee_category_id: "feecat_claim_cleanup",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_claim_cleanup",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: "delivered" as LotStatus,
          winner_customer_id: winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at: new Date(Date.now() - 60_000),
        },
      ])
      return row.id
    }

    // One private file + one claim row, as the open-claim POST leaves them.
    // `closedAgoMs` sets `confirmed_at` for `confirmed` and `decided_at` for
    // `rejected` (the timestamps D-027/D-038 close a claim with).
    const seedClaim = async (options: {
      sellerId: string
      customerId: string
      status: string
      closedAgoMs?: number
      videoDeletedAgoMs?: number
    }) => {
      const lotId = await lot(options.sellerId, options.customerId)
      const { result } = await uploadFarmFileWorkflow(getContainer()).run({
        input: {
          filename: "unboxing.mp4",
          mimeType: "video/mp4",
          content: VIDEO.toString("base64"),
          access: "private",
        },
      })
      const closedAt =
        options.closedAgoMs === undefined
          ? null
          : new Date(Date.now() - options.closedAgoMs)
      const [row] = await moderation().createClaims([
        {
          lot_id: lotId,
          customer_id: options.customerId,
          seller_id: options.sellerId,
          remedy: "refund",
          status: options.status as never,
          video_file_key: result[0].id,
          confirmed_at: options.status === "confirmed" ? closedAt : null,
          decided_at: options.status === "rejected" ? closedAt : null,
          video_deleted_at:
            options.videoDeletedAgoMs === undefined
              ? null
              : new Date(Date.now() - options.videoDeletedAgoMs),
        },
      ])
      return { claim: row, lotId, fileKey: result[0].id }
    }

    const rowById = async (id: string) => {
      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "claim",
          fields: [
            "id",
            "status",
            "lot_id",
            "seller_id",
            "customer_id",
            "remedy",
            "video_file_key",
            "video_deleted_at",
            "confirmed_at",
            "decided_at",
          ],
          filters: { id },
        })
      return row as {
        id: string
        status: string
        lot_id: string
        seller_id: string
        customer_id: string
        remedy: string
        video_file_key: string
        video_deleted_at: string | Date | null
        confirmed_at: string | Date | null
        decided_at: string | Date | null
      }
    }

    const hasVideo = async (options: {
      claimId: string
      lotId: string
      vendor: Record<string, string>
      buyer: Record<string, string>
      status: string
    }) => {
      const detail = await api.get(`/store/won-lots/${options.lotId}`, {
        headers: options.buyer,
      })
      const vendor = await api.get(
        `/vendor/claims?status=${options.status}`,
        { headers: options.vendor }
      )
      const adminRes = await api.get(`/admin/claims?status=${options.status}`, {
        headers: admin,
      })
      return {
        detail: detail.data.lot.claim?.has_video as boolean | undefined,
        vendor: (vendor.data.claims as { id: string; has_video: boolean }[]).find(
          (row) => row.id === options.claimId
        )?.has_video,
        admin: (adminRes.data.claims as { id: string; has_video: boolean }[]).find(
          (row) => row.id === options.claimId
        )?.has_video,
      }
    }

    beforeEach(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `claim-cleanup-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    it("deletes a confirmed claim's video older than 30 days, keeps the row, flips has_video on all three reads", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const { claim, lotId, fileKey } = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })
      const before = await rowById(claim.id)
      expect(await fileExists(fileKey)).toBe(true)
      expect(
        await hasVideo({
          claimId: claim.id,
          lotId,
          vendor: farm.vendor,
          buyer: buyer.headers,
          status: "confirmed",
        })
      ).toEqual({ detail: true, vendor: true, admin: true })

      await deleteClaimVideos(getContainer())

      expect(await fileExists(fileKey)).toBe(false)
      const after = await rowById(claim.id)
      expect(new Date(after.video_deleted_at as string).getTime()).toBeGreaterThan(0)
      // The row survives with every other column unchanged.
      expect(after.id).toEqual(before.id)
      expect(after.status).toEqual("confirmed")
      expect(after.lot_id).toEqual(before.lot_id)
      expect(after.seller_id).toEqual(before.seller_id)
      expect(after.customer_id).toEqual(before.customer_id)
      expect(after.remedy).toEqual(before.remedy)
      expect(after.video_file_key).toEqual(fileKey)
      expect(new Date(after.confirmed_at as string).getTime()).toEqual(
        new Date(before.confirmed_at as string).getTime()
      )
      expect(
        await hasVideo({
          claimId: claim.id,
          lotId,
          vendor: farm.vendor,
          buyer: buyer.headers,
          status: "confirmed",
        })
      ).toEqual({ detail: false, vendor: false, admin: false })
    })

    it("deletes a rejected claim's video by decided_at", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const { claim, fileKey } = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "rejected",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })

      await deleteClaimVideos(getContainer())

      expect(await fileExists(fileKey)).toBe(false)
      expect(
        new Date((await rowById(claim.id)).video_deleted_at as string).getTime()
      ).toBeGreaterThan(0)
    })

    it("leaves a confirmed claim inside the 30-day window untouched", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const { claim, fileKey } = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS - DAY,
      })

      await deleteClaimVideos(getContainer())

      expect(await fileExists(fileKey)).toBe(true)
      expect((await rowById(claim.id)).video_deleted_at).toBeNull()
    })

    it("never touches open, approved, disputed or resolved claims, however old", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const seeded: { id: string; fileKey: string; status: string }[] = []
      for (const status of ["open", "approved", "disputed", "resolved"]) {
        const { claim, fileKey } = await seedClaim({
          sellerId: farm.seller.id,
          customerId: buyer.id,
          status,
        })
        // Old in every column the job could look at.
        await moderation().updateClaims([
          {
            id: claim.id,
            confirmed_at: new Date(Date.now() - 90 * DAY),
            decided_at: new Date(Date.now() - 90 * DAY),
          },
        ])
        seeded.push({ id: claim.id, fileKey, status })
      }

      await deleteClaimVideos(getContainer())

      for (const row of seeded) {
        expect(await fileExists(row.fileKey)).toBe(true)
        expect((await rowById(row.id)).video_deleted_at).toBeNull()
      }
    })

    it("skips an already-cleaned claim on a second run and deletes nothing", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const { claim, fileKey } = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })
      const logger = getContainer().resolve(ContainerRegistrationKeys.LOGGER)
      const info = jest.spyOn(logger, "info")

      await deleteClaimVideos(getContainer())
      const firstFlag = (await rowById(claim.id)).video_deleted_at
      info.mockClear()

      await deleteClaimVideos(getContainer())

      expect(await fileExists(fileKey)).toBe(false)
      expect((await rowById(claim.id)).video_deleted_at).toEqual(firstFlag)
      const summary = info.mock.calls
        .map((call) => String(call[0]))
        .find((line) => line.startsWith("delete-claim-videos:"))
      expect(summary).toEqual(
        "delete-claim-videos: found 0, deleted 0, skipped 0, failed 0"
      )
      info.mockRestore()
    })

    it("sets the flag when the file is already gone (ENOENT ignored)", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const { claim, fileKey } = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })
      await fileModule().deleteFiles(fileKey)
      expect(await fileExists(fileKey)).toBe(false)

      await expect(deleteClaimVideos(getContainer())).resolves.toBeUndefined()

      expect(
        new Date((await rowById(claim.id)).video_deleted_at as string).getTime()
      ).toBeGreaterThan(0)
    })

    it("logs one failed row, still processes the rest, and exits normally", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      const first = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })
      const second = await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })

      // One failure in the mark step; the job's per-id try/catch must swallow it.
      const spy = jest
        .spyOn(moderation(), "updateClaims")
        .mockRejectedValueOnce(new Error("qa: simulated update failure"))

      await expect(deleteClaimVideos(getContainer())).resolves.toBeUndefined()
      spy.mockRestore()

      const after = await Promise.all([rowById(first.claim.id), rowById(second.claim.id)])
      expect(after.filter((row) => row.video_deleted_at !== null)).toHaveLength(1)

      // A later run cleans the row the failure left behind.
      await deleteClaimVideos(getContainer())
      const settled = await Promise.all([
        rowById(first.claim.id),
        rowById(second.claim.id),
      ])
      expect(settled.every((row) => row.video_deleted_at !== null)).toBe(true)
    })

    it("writes no wallet_transaction row (D-058)", async () => {
      const farm = await registerFarm()
      const buyer = await winner()
      await seedClaim({
        sellerId: farm.seller.id,
        customerId: buyer.id,
        status: "confirmed",
        closedAgoMs: CLAIM_VIDEO_RETENTION_MS + DAY,
      })
      const wallets =
        getContainer().resolve<WalletModuleService>(WALLET_MODULE)
      const [wallet] = await wallets.createWallets([{}])
      await wallets.createWalletTransactions([
        { wallet_id: wallet.id, type: "manual_topup", amount: 100_000 },
      ])
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const totals = async () => {
        const rows = (await pg.raw(
          `SELECT count(*)::int AS n, coalesce(sum(amount), 0) AS total FROM wallet_transaction`
        )) as { rows: { n: number; total: string }[] }
        return rows.rows[0]
      }
      const before = await totals()

      await deleteClaimVideos(getContainer())

      const after = await totals()
      expect(after.n).toEqual(before.n)
      expect(Number(after.total)).toEqual(Number(before.total))
    })
  },
})
