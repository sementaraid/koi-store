import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import {
  createStrikeStep,
  removeStrikeStep,
} from "../../src/workflows/steps/strike"

jest.setTimeout(120 * 1000)

// US-059 T-059.1a (AC1, AC2, AC3, AC4; D-003, D-037, D-041, D-042, D-045,
// D-055, D-058): give/remove a strike, the 180-day window, the derived ban,
// the admin rows' `active_strikes`/`banned`, no money and no PII.

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const WINNER_PHONE = "+6281111222333"
const NIK = "3273012345678901"
const ACCOUNT = "1234567890"

type HttpResponse = { status: number; data: { message?: string; code?: string } }
const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
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

const failAfterStrikeStep = createStep("qa-fail-after-strike", async () => {
  throw new Error("qa: simulated failure after createStrikeStep")
})
const giveThenFailWorkflow = createWorkflow(
  "qa-give-strike-then-fail",
  function (input: {
    customer_id: string
    reason_type: "winner_unpaid"
    reason: string
    created_by: string
  }) {
    createStrikeStep({
      customer_id: input.customer_id,
      seller_id: null,
      lot_id: null,
      reason_type: input.reason_type,
      reason: input.reason,
      created_by: input.created_by,
    })
    failAfterStrikeStep()
  }
)

const failAfterRemoveStep = createStep("qa-fail-after-strike-remove", async () => {
  throw new Error("qa: simulated failure after removeStrikeStep")
})
const removeThenFailWorkflow = createWorkflow(
  "qa-remove-strike-then-fail",
  function (input: { strike_id: string; removed_by: string; reason: string }) {
    removeStrikeStep({
      strike_id: input.strike_id,
      removed_by: input.removed_by,
      removed_reason: input.reason,
    })
    failAfterRemoveStep()
  }
)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallet = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    let admin: Record<string, string>
    let adminId: string

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `strike-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    // A farmer as US-020 leaves one: customer + member + seller on one auth
    // identity (D-003), so the seller resolves to the customer by member email.
    const registerFarm = async () => {
      const container = getContainer()
      const email = `strike-farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso" }])
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
      return { seller, customer }
    }

    const winner = async () => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `strike-winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
            first_name: "Siti",
            last_name: "Rahmawati",
            phone: WINNER_PHONE,
          },
        ])
      return row
    }

    const soldLot = async (options: {
      sellerId: string
      winnerId: string
      status?: LotStatus
    }) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: options.sellerId,
          fee_category_id: "feecat_strike",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [lot] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: `prod_strike_${Date.now()}`,
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status: options.status ?? "won",
          winner_customer_id: options.winnerId,
          final_price: 1_500_000,
          closed_at: new Date(Date.now() - 25 * HOUR),
        },
      ])
      return lot
    }

    const give = (body: Record<string, unknown>, headers = admin) =>
      api.post("/admin/strikes", body, { headers })

    const giveBody = (customerId: string, reason = "Pemenang tidak membayar.") => ({
      customer_id: customerId,
      reason_type: "winner_unpaid",
      reason,
    })

    const remove = (id: string, body: unknown, headers = admin) =>
      api.post(`/admin/strikes/${id}/remove`, body, { headers })

    const strikeById = (id: string) => moderation().retrieveStrike(id)

    const backdate = async (id: string, days: number) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.PG_CONNECTION)
        .raw(`UPDATE strike SET created_at = ? WHERE id = ?`, [
          new Date(Date.now() - days * DAY),
          id,
        ])

    describe("give a strike (AC1, AC4, D-041)", () => {
      it("gives one to a customer by id and returns the pinned shape", async () => {
        const buyer = await winner()

        const res = await give(giveBody(buyer.id))
        expect(res.status).toEqual(201)
        expect(res.data.strike).toEqual({
          id: expect.stringMatching(/^strk_/),
          customer_id: buyer.id,
          seller_id: null,
          lot_id: null,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar.",
          created_at: expect.any(String),
          removed_at: null,
          removed_by: null,
          removed_reason: null,
        })
        expect(res.data.ban).toEqual({ active_count: 1, banned: false })

        const stored = await strikeById(res.data.strike.id)
        expect(stored.created_by).toEqual(adminId)
        expect(stored.seller_id).toBeNull()
      })

      it("resolves a seller to its member's customer by email (D-003)", async () => {
        const farm = await registerFarm()

        const res = await give({
          seller_id: farm.seller.id,
          reason_type: "farmer_not_shipped",
          reason: "Lot berbayar belum dikirim.",
        })
        expect(res.status).toEqual(201)
        expect(res.data.strike.customer_id).toEqual(farm.customer.id)
        expect(res.data.strike.seller_id).toEqual(farm.seller.id)
        expect(res.data.strike.lot_id).toBeNull()
      })

      it("resolves a lot to its winner", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lot = await soldLot({ sellerId: farm.seller.id, winnerId: buyer.id })

        const res = await give({
          lot_id: lot.id,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar.",
        })
        expect(res.status).toEqual(201)
        expect(res.data.strike.customer_id).toEqual(buyer.id)
        expect(res.data.strike.lot_id).toEqual(lot.id)
      })

      it("404s a missing subject, an unknown id, a seller with no account and an unknown lot", async () => {
        const farm = await registerFarm()
        const empty = await failure(
          give({ reason_type: "winner_unpaid", reason: "Pemenang tidak membayar." })
        )
        expect(empty.status).toEqual(404)
        expect(empty.data.message).toEqual("Akun pemilik kebun tidak ditemukan.")

        for (const body of [
          {
            customer_id: "cus_does_not_exist",
            reason_type: "winner_unpaid",
            reason: "Pemenang tidak membayar.",
          },
          {
            seller_id: "sel_does_not_exist",
            reason_type: "farmer_not_shipped",
            reason: "Lot berbayar belum dikirim.",
          },
        ]) {
          const refused = await failure(give(body))
          expect(refused.status).toEqual(404)
          expect(refused.data.message).toEqual(
            "Akun pemilik kebun tidak ditemukan."
          )
        }

        const lotless = await failure(
          give({
            lot_id: "lot_does_not_exist",
            reason_type: "farmer_not_shipped",
            reason: "Lot berbayar belum dikirim.",
          })
        )
        expect(lotless.status).toEqual(404)
        expect(lotless.data.message).toEqual("Lot tidak ditemukan.")

        // A seller whose member email has no customer: 404, no partial row.
        const sellerModule = getContainer().resolve<{
          createSellers: (
            data: Record<string, unknown>[]
          ) => Promise<{ id: string }[]>
        }>("seller")
        const [orphan] = await sellerModule.createSellers([
          {
            name: `Kebun orphan ${Date.now()}`,
            email: `strike-orphan-${Date.now()}@test.dev`,
            currency_code: "idr",
          },
        ])
        const orphanRes = await failure(
          give({
            seller_id: orphan.id,
            reason_type: "farmer_not_shipped",
            reason: "Lot berbayar belum dikirim.",
          })
        )
        expect(orphanRes.status).toEqual(404)
        expect(await moderation().listStrikes()).toHaveLength(0)
        // Farm's own customer is still strikeable; nothing else was written.
        expect(farm.customer.id).toBeTruthy()
      })

      it("400s a blank reason, an unknown reason_type and an unknown field (D-055)", async () => {
        const buyer = await winner()
        for (const body of [
          giveBody(buyer.id, "   "),
          { ...giveBody(buyer.id), reason: "" },
          {
            customer_id: buyer.id,
            reason_type: "not_a_reason",
            reason: "Alasan.",
          },
          { ...giveBody(buyer.id), extra: true },
        ]) {
          const refused = await failure(give(body))
          expect(refused.status).toEqual(400)
        }

        const blank = await failure(give(giveBody(buyer.id, " ")))
        expect(JSON.stringify(blank.data)).toContain(
          "Alasan strike wajib diisi."
        )
        const type = await failure(
          give({
            customer_id: buyer.id,
            reason_type: "not_a_reason",
            reason: "Alasan.",
          })
        )
        expect(JSON.stringify(type.data)).toContain("Jenis strike tidak dikenal.")
        expect(await moderation().listStrikes()).toHaveLength(0)
      })
    })

    describe("remove a strike (AC3, AC4)", () => {
      it("sets the three removal columns and keeps the row", async () => {
        const buyer = await winner()
        const created = await give(giveBody(buyer.id))

        const res = await remove(created.data.strike.id, {
          reason: "Salah orang.",
        })
        expect(res.status).toEqual(200)
        expect(res.data.strike).toEqual({
          ...created.data.strike,
          removed_at: expect.any(String),
          removed_by: adminId,
          removed_reason: "Salah orang.",
        })
        expect(res.data.ban).toEqual({ active_count: 0, banned: false })

        const stored = await strikeById(created.data.strike.id)
        expect(stored.removed_at).not.toBeNull()
        expect(stored.removed_by).toEqual(adminId)
        expect(stored.removed_reason).toEqual("Salah orang.")
      })

      it("404s a second removal, an unknown strike and a blank reason", async () => {
        const buyer = await winner()
        const created = await give(giveBody(buyer.id))
        expect(
          (await remove(created.data.strike.id, { reason: "Salah orang." }))
            .status
        ).toEqual(200)

        const twice = await failure(
          remove(created.data.strike.id, { reason: "Salah orang." })
        )
        expect(twice.status).toEqual(404)
        expect(twice.data.message).toEqual("Strike tidak ditemukan.")

        const unknown = await failure(
          remove("strk_does_not_exist", { reason: "Salah orang." })
        )
        expect(unknown.status).toEqual(404)

        const other = await give(giveBody(buyer.id))
        const blank = await failure(remove(other.data.strike.id, { reason: " " }))
        expect(blank.status).toEqual(400)
        expect(JSON.stringify(blank.data)).toContain(
          "Alasan pencabutan wajib diisi."
        )
        expect((await strikeById(other.data.strike.id)).removed_at).toBeNull()
      })
    })

    describe("the window and the derived ban (AC2, AC3)", () => {
      it("1 active is not banned, 2 is; removing one lifts it", async () => {
        const buyer = await winner()
        const first = await give(giveBody(buyer.id))
        expect(first.data.ban).toEqual({ active_count: 1, banned: false })

        const second = await give(giveBody(buyer.id))
        expect(second.data.ban).toEqual({ active_count: 2, banned: true })

        const removed = await remove(second.data.strike.id, { reason: "Salah." })
        expect(removed.data.ban).toEqual({ active_count: 1, banned: false })

        const history = await api.get(
          `/admin/strikes?customer_id=${buyer.id}`,
          { headers: admin }
        )
        expect(history.status).toEqual(200)
        expect(history.data.active_count).toEqual(1)
        expect(history.data.banned).toBe(false)
        expect(history.data.count).toEqual(2)
        expect(history.data.limit).toEqual(20)
        expect(history.data.offset).toEqual(0)
        expect(history.data.strikes.map((s: { id: string }) => s.id)).toEqual([
          second.data.strike.id,
          first.data.strike.id,
        ])
      })

      it("a strike 180 days old is not counted and cannot ban", async () => {
        const buyer = await winner()
        const old = await give(giveBody(buyer.id))
        await backdate(old.data.strike.id, 180)

        const fresh = await give(giveBody(buyer.id))
        expect(fresh.data.ban).toEqual({ active_count: 1, banned: false })

        await backdate(fresh.data.strike.id, 181)
        const history = await api.get(
          `/admin/strikes?customer_id=${buyer.id}`,
          { headers: admin }
        )
        expect(history.data.active_count).toEqual(0)
        expect(history.data.banned).toBe(false)
      })
    })

    describe("the admin rows carry the derived state (AC2)", () => {
      it("reports rows carry the winner's active_strikes and banned", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const other = await winner()
        const lot = await soldLot({ sellerId: farm.seller.id, winnerId: buyer.id })
        const otherLot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: other.id,
        })
        await moderation().createLotReports([
          { lot_id: lot.id, seller_id: farm.seller.id, winner_customer_id: buyer.id },
          {
            lot_id: otherLot.id,
            seller_id: farm.seller.id,
            winner_customer_id: other.id,
          },
        ])
        await give(giveBody(buyer.id))
        await give(giveBody(buyer.id))

        const res = await api.get("/admin/reports", { headers: admin })
        expect(res.status).toEqual(200)
        const byLot = new Map(
          res.data.reports.map((r: { lot_id: string }) => [r.lot_id, r])
        )
        expect(byLot.get(lot.id)).toMatchObject({
          active_strikes: 2,
          banned: true,
        })
        expect(byLot.get(otherLot.id)).toMatchObject({
          active_strikes: 0,
          banned: false,
        })
      })

      it("claim rows carry the seller's active_strikes and banned", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lot = await soldLot({
          sellerId: farm.seller.id,
          winnerId: buyer.id,
          status: "delivered",
        })
        await moderation().createClaims([
          {
            lot_id: lot.id,
            customer_id: buyer.id,
            seller_id: farm.seller.id,
            remedy: "refund",
            video_file_key: "private-strike-test.mp4",
          },
        ])
        await give({
          seller_id: farm.seller.id,
          reason_type: "farmer_claim_refused",
          reason: "Menolak klaim yang disetujui.",
        })
        await give({
          seller_id: farm.seller.id,
          reason_type: "farmer_claim_refused",
          reason: "Menolak klaim yang disetujui.",
        })

        const res = await api.get("/admin/claims", { headers: admin })
        expect(res.status).toEqual(200)
        expect(res.data.claims[0]).toMatchObject({
          seller: { name: farm.seller.name },
          active_strikes: 2,
          banned: true,
        })
      })
    })

    describe("no money and no PII (D-042, D-045, D-058)", () => {
      it("writes no wallet row, changes no balance and returns no phone, NIK or bank", async () => {
        const farm = await registerFarm()
        const buyer = await winner()
        const lot = await soldLot({ sellerId: farm.seller.id, winnerId: buyer.id })
        const ledgerBefore = await wallet().listWalletTransactions()
        const balancesBefore = await wallet().listWallets()

        const given = await give({
          lot_id: lot.id,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar.",
        })
        const removed = await remove(given.data.strike.id, { reason: "Salah." })
        const history = await api.get(
          `/admin/strikes?customer_id=${buyer.id}`,
          { headers: admin }
        )

        expect(await wallet().listWalletTransactions()).toHaveLength(
          ledgerBefore.length
        )
        expect(await wallet().listWallets()).toEqual(balancesBefore)

        for (const payload of [given.data, removed.data, history.data]) {
          const json = JSON.stringify(payload)
          for (const secret of [
            WINNER_PHONE,
            NIK,
            ACCOUNT,
            "phone",
            "ktp_nik",
            "account_number",
            "holder_name",
            "amount",
            "balance",
          ]) {
            expect(json).not.toContain(secret)
          }
        }
        // Farm customer's own data never leaks either.
        expect(JSON.stringify(history.data)).not.toContain(farm.seller.email)
      })
    })

    describe("compensation", () => {
      it("deletes the strike when a later step fails", async () => {
        const buyer = await winner()
        const run = await giveThenFailWorkflow(getContainer()).run({
          input: {
            customer_id: buyer.id,
            reason_type: "winner_unpaid",
            reason: "Pemenang tidak membayar.",
            created_by: adminId,
          },
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        expect(await moderation().listStrikes({ customer_id: buyer.id })).toHaveLength(0)
      })

      it("restores the three removal columns when a later step fails", async () => {
        const buyer = await winner()
        const created = await give(giveBody(buyer.id))
        const run = await removeThenFailWorkflow(getContainer()).run({
          input: {
            strike_id: created.data.strike.id,
            removed_by: adminId,
            reason: "Salah.",
          },
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        const stored = await strikeById(created.data.strike.id)
        expect(stored.removed_at).toBeNull()
        expect(stored.removed_by).toBeNull()
        expect(stored.removed_reason).toBeNull()
      })
    })

    describe("auth (D-002)", () => {
      it("401s an anonymous caller and a customer token on all three routes", async () => {
        const buyer = await winner()
        const created = await give(giveBody(buyer.id))
        const customer = {
          authorization: `Bearer ${jwt(getContainer(), buyer.id, "customer")}`,
        }

        expect((await failure(give(giveBody(buyer.id), {}))).status).toEqual(401)
        expect(
          (await failure(give(giveBody(buyer.id), customer))).status
        ).toEqual(401)
        expect(
          (await failure(remove(created.data.strike.id, { reason: "Salah." }, {})))
            .status
        ).toEqual(401)
        expect(
          (await failure(
            remove(created.data.strike.id, { reason: "Salah." }, customer)
          )).status
        ).toEqual(401)
        expect(
          (await failure(
            api.get(`/admin/strikes?customer_id=${buyer.id}`)
          )).status
        ).toEqual(401)
        expect(
          (
            await failure(
              api.get(`/admin/strikes?customer_id=${buyer.id}`, {
                headers: customer,
              })
            )
          ).status
        ).toEqual(401)

        // The refused calls left the row untouched.
        expect((await strikeById(created.data.strike.id)).removed_at).toBeNull()
      })
    })
  },
})
