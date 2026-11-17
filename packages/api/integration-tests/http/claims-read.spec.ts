import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createSellerAccountWorkflow,
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"

jest.setTimeout(120 * 1000)

// US-054 T-054.1b (AC1 window read, AC3, D-018, D-042, D-045, D-052, D-054):
// the winner's won-lot row carries `claim` and `claim_window_ends_at`; the
// farmer and admin claim queues carry masked names only and `has_video`, never
// a key, URL, customer id or phone; the video bytes come only from the
// authenticated routes.

const HOUR = 60 * 60 * 1000
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-unboxing-claim")
const WINNER_PHONE = "+6281111222333"
const SELLER_PHONE = "+6289999000111"

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

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

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    // A farmer as US-020 leaves one (customer + member + seller).
    const registerFarm = async () => {
      const container = getContainer()
      const email = `claims-read-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
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
      // A phone a leak would expose (D-052); the workflow input has no field.
      await container
        .resolve(ContainerRegistrationKeys.PG_CONNECTION)
        .raw(`UPDATE seller SET phone = ? WHERE id = ?`, [SELLER_PHONE, seller.id])
      const signIn = await api.post("/auth/member/emailpass", { email, password })
      return {
        seller,
        vendor: {
          authorization: `Bearer ${signIn.data.token}`,
          "x-seller-id": seller.id,
        },
      }
    }

    // A winner with a phone set, so a leak would show (D-052).
    const winner = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `claims-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: "Siti",
          last_name: "Rahmawati",
          phone: WINNER_PHONE,
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

    // T-054.1 readiness: the paid/delivered routes are parked, so lots are
    // seeded through the module service.
    const lot = async (options: {
      sellerId: string
      winnerId: string
      status: LotStatus
      deliveredAgoMs?: number | null
    }) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_claims_read",
          start_at: new Date(Date.now() - 2 * 24 * HOUR),
          end_at: new Date(Date.now() - 24 * HOUR),
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
          product_id: "prod_claims_read",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: options.status,
          winner_customer_id: options.winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at:
            options.deliveredAgoMs == null
              ? null
              : new Date(Date.now() - options.deliveredAgoMs),
        },
      ])
      return row.id
    }

    // One private video + one claim row, as T-054.1a's POST leaves them.
    const claim = async (options: {
      lotId: string
      customerId: string
      sellerId: string
      status?: string
    }) => {
      const { result } = await uploadFarmFileWorkflow(getContainer()).run({
        input: {
          filename: "unboxing.mp4",
          mimeType: "video/mp4",
          content: VIDEO.toString("base64"),
          access: "private",
        },
      })
      const [row] = await moderation().createClaims([
        {
          lot_id: options.lotId,
          customer_id: options.customerId,
          seller_id: options.sellerId,
          remedy: "refund",
          status: (options.status ?? "open") as never,
          video_file_key: result[0].id,
        },
      ])
      return row
    }

    beforeEach(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `claims-read-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    describe("won-lot row (AC1 window read)", () => {
      it("carries the caller's claim and the window end, 4 h after delivered_at", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const created = await claim({
          lotId,
          customerId: buyer.id,
          sellerId: farm.seller.id,
        })

        const list = await api.get("/store/won-lots", { headers: buyer.headers })
        expect(list.status).toEqual(200)
        // Same two fields on the list and the detail (shared mapper).
        for (const row of [
          list.data.lots[0],
          (await api.get(`/store/won-lots/${lotId}`, { headers: buyer.headers }))
            .data.lot,
        ]) {
          expect(row.delivered_at).toEqual(expect.any(String))
          expect(row.claim).toEqual({
            id: created.id,
            status: "open",
            remedy: "refund",
            opened_at: new Date(created.created_at).toISOString(),
            has_video: true,
          })
          expect(
            new Date(row.claim_window_ends_at).getTime() -
              new Date(row.delivered_at).getTime()
          ).toEqual(4 * HOUR)
        }
      })

      it("has claim_window_ends_at null on a shipped lot", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "shipped",
        })

        const res = await api.get(`/store/won-lots/${lotId}`, {
          headers: buyer.headers,
        })
        expect(res.data.lot.claim_window_ends_at).toBeNull()
        expect(res.data.lot.claim).toBeNull()
      })

      it("404s another customer's lot and 401s an anonymous caller", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const other = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })

        expect(
          await statusOf(
            api.get(`/store/won-lots/${lotId}`, { headers: other.headers })
          )
        ).toEqual(404)
        expect(
          await statusOf(
            api.get(`/store/won-lots/${lotId}`, {
              headers: { "x-publishable-api-key": publishable },
            })
          )
        ).toEqual(401)
      })
    })

    describe("farmer claim queue (AC3)", () => {
      it("lists only the caller's claims, name and product only", async () => {
        const farm = await registerFarm()
        const otherFarm = await registerFarm()
        const buyer = await winner()
        const ownLot = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const otherLot = await lot({
          sellerId: otherFarm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const own = await claim({
          lotId: ownLot,
          customerId: buyer.id,
          sellerId: farm.seller.id,
        })
        await claim({
          lotId: otherLot,
          customerId: buyer.id,
          sellerId: otherFarm.seller.id,
        })

        const res = await api.get("/vendor/claims", { headers: farm.vendor })
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({
          claims: [
            {
              id: own.id,
              lot_id: ownLot,
              status: "open",
              remedy: "refund",
              opened_at: new Date(own.created_at).toISOString(),
              has_video: true,
              winner: { name: "Siti Rahmawati" },
              // product_id has no matching product row in this seed.
              product: { title: null, thumbnail: null },
            },
          ],
          count: 1,
          limit: 20,
          offset: 0,
        })
        expect(JSON.stringify(res.data)).not.toContain(otherLot)

        // D-018/D-045/D-052: no key, URL, customer id or phone.
        const json = JSON.stringify(res.data)
        for (const forbidden of [
          "private-",
          "http",
          "video_file_key",
          "customer_id",
          buyer.id,
          WINNER_PHONE,
          SELLER_PHONE,
          "phone",
        ]) {
          expect(json).not.toContain(forbidden)
        }
      })

      it("filters by status", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const disputedLot = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        await claim({
          lotId: disputedLot,
          customerId: buyer.id,
          sellerId: farm.seller.id,
          status: "disputed",
        })

        // No status filter: every status; `?status=` narrows it.
        const all = await api.get("/vendor/claims", { headers: farm.vendor })
        expect(all.data.count).toEqual(1)
        const open = await api.get("/vendor/claims?status=open", {
          headers: farm.vendor,
        })
        expect(open.data.count).toEqual(0)
        const disputed = await api.get("/vendor/claims?status=disputed", {
          headers: farm.vendor,
        })
        expect(disputed.data.count).toEqual(1)
        expect(disputed.data.claims[0].status).toEqual("disputed")
        expect(
          await statusOf(
            api.get("/vendor/claims?status=nope", { headers: farm.vendor })
          )
        ).toEqual(400)
      })

      it("refuses a terminated farm with 403 but allows a suspended one (D-054)", async () => {
        const container = getContainer()
        const farm = await registerFarm()
        const buyer = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const claimRow = await claim({
          lotId,
          customerId: buyer.id,
          sellerId: farm.seller.id,
        })

        await suspendSellerWorkflow(container).run({
          input: { seller_id: farm.seller.id, reason: "qa suspend" },
        })
        expect(
          await statusOf(api.get("/vendor/claims", { headers: farm.vendor }))
        ).toEqual(200)
        expect(
          await statusOf(
            api.get(`/vendor/claims/${claimRow.id}/video`, { headers: farm.vendor })
          )
        ).toEqual(200)

        await terminateSellerWorkflow(container).run({
          input: { seller_id: farm.seller.id, reason: "qa terminate" },
        })
        expect(
          await statusOf(api.get("/vendor/claims", { headers: farm.vendor }))
        ).toEqual(403)
        expect(
          await statusOf(
            api.get(`/vendor/claims/${claimRow.id}/video`, { headers: farm.vendor })
          )
        ).toEqual(403)
      })
    })

    describe("admin claim queue (AC3)", () => {
      it("defaults to open, reads disputed on filter, oldest first", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const makeClaim = async (status?: string) => {
          const lotId = await lot({
            sellerId: farm.seller.id,
            winnerId: buyer.id,
            status: "delivered",
            deliveredAgoMs: HOUR,
          })
          return claim({
            lotId,
            customerId: buyer.id,
            sellerId: farm.seller.id,
            status,
          })
        }
        const first = await makeClaim()
        const second = await makeClaim()
        const disputed = await makeClaim("disputed")

        const res = await api.get("/admin/claims", { headers: admin })
        expect(res.status).toEqual(200)
        expect(res.data.count).toEqual(2)
        expect(res.data.claims.map((c: { id: string }) => c.id)).toEqual([
          first.id,
          second.id,
        ])
        expect(res.data.claims[0]).toEqual({
          id: first.id,
          lot_id: first.lot_id,
          status: "open",
          remedy: "refund",
          opened_at: new Date(first.created_at).toISOString(),
          has_video: true,
          winner: { name: "Siti Rahmawati" },
          seller: { name: farm.seller.name },
          product: { title: null, thumbnail: null },
        })
        expect(JSON.stringify(res.data)).not.toContain(disputed.id)

        const filtered = await api.get("/admin/claims?status=disputed", {
          headers: admin,
        })
        expect(filtered.data.claims.map((c: { id: string }) => c.id)).toEqual([
          disputed.id,
        ])

        // Masked PII only (D-042/D-052).
        const json = JSON.stringify(res.data)
        for (const forbidden of [
          "private-",
          "http",
          "video_file_key",
          "customer_id",
          buyer.id,
          WINNER_PHONE,
          SELLER_PHONE,
          "phone",
        ]) {
          expect(json).not.toContain(forbidden)
        }
      })
    })

    describe("video routes (D-018)", () => {
      it("streams the bytes to the owner and the admin, private and uncached", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const claimRow = await claim({
          lotId,
          customerId: buyer.id,
          sellerId: farm.seller.id,
        })

        const vendorVideo = await api.get(
          `/vendor/claims/${claimRow.id}/video`,
          { headers: farm.vendor, responseType: "arraybuffer" }
        )
        expect(vendorVideo.status).toEqual(200)
        expect(vendorVideo.headers["content-type"]).toEqual("video/mp4")
        expect(vendorVideo.headers["cache-control"]).toEqual("private, no-store")
        expect(Buffer.from(vendorVideo.data).equals(VIDEO)).toBe(true)

        const adminVideo = await api.get(
          `/admin/claims/${claimRow.id}/video`,
          { headers: admin, responseType: "arraybuffer" }
        )
        expect(adminVideo.status).toEqual(200)
        expect(adminVideo.headers["content-type"]).toEqual("video/mp4")
        expect(Buffer.from(adminVideo.data).equals(VIDEO)).toBe(true)
      })

      it("404s another farm and 401s a customer token on the admin route", async () => {
        const farm = await registerFarm()
        const otherFarm = await registerFarm()
        const buyer = await winner()
        const lotId = await lot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
          deliveredAgoMs: HOUR,
        })
        const claimRow = await claim({
          lotId,
          customerId: buyer.id,
          sellerId: farm.seller.id,
        })

        expect(
          await statusOf(
            api.get(`/vendor/claims/${claimRow.id}/video`, {
              headers: otherFarm.vendor,
            })
          )
        ).toEqual(404)
        expect(
          await statusOf(
            api.get(`/admin/claims/${claimRow.id}/video`, {
              headers: buyer.headers,
            })
          )
        ).toEqual(401)
      })
    })
  },
})
