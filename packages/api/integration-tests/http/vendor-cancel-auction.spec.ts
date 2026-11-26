import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import { createCustomerWalletWorkflow } from "../../src/workflows/create-customer-wallet"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { closeLotWorkflow } from "../../src/workflows/close-lot"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"

jest.setTimeout(120 * 1000)

// US-060 T-060.1 (AC1–AC3, D-020, D-022, D-031, D-034, D-035, D-054): the
// farmer cancels before the auction starts. Every joiner's own recorded
// `join_fee` comes back as a `refund` (+) row; the listing fee never does; a
// `live`/`closed`/`cancelled` auction is a 409; lots stay `open`.

const DAY = 24 * 60 * 60 * 1000
const FARMER_PHONE = "+6281234567890"
const BUYER_PHONE = "+6281111222333"

type HttpResponse = {
  status: number
  data: { code?: string; message?: string; [key: string]: unknown }
}
const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const jwt = (container: MedusaContainer, actor_id: string, actor_type: "customer" | "user") => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id, actor_type, auth_identity_id: "", app_metadata: {}, user_metadata: {} },
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
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)
    const query = () =>
      getContainer().resolve(ContainerRegistrationKeys.QUERY)

    // An approved farm whose customer wallet holds `balance`, ready to submit.
    const registerFarm = async (options: { approve?: boolean; balance?: number } = {}) => {
      const container = getContainer()
      const email = `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso", phone: FARMER_PHONE }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          payment_details: {
            holder_name: "Budi Santoso",
            bank_name: "BCA",
            account_number: "1234567890",
          },
        },
      })
      if (options.approve !== false) {
        await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
      }

      await createCustomerWalletWorkflow(container).run({ input: { customer_id: customer.id } })
      const {
        data: [row],
      } = await query().graph({
        entity: "customer",
        fields: ["wallet.id"],
        filters: { id: customer.id },
      })
      const walletId = row.wallet!.id as string
      if (options.balance) {
        await wallets().createWalletTransactions([
          { wallet_id: walletId, type: "manual_topup", amount: options.balance, reference: "test" },
        ])
      }

      const signIn = await api.post("/auth/member/emailpass", { email, password })
      return {
        seller,
        customer,
        walletId,
        vendor: { authorization: `Bearer ${signIn.data.token}`, "x-seller-id": seller.id },
      }
    }

    const createCategory = async () => {
      const { result } = await createFeeCategoriesWorkflow(getContainer()).run({
        input: {
          fee_categories: [
            { name: `Kategori ${Date.now()}-${Math.random()}`, listing_fee: 50_000, join_fee: 100_000 },
          ],
        },
      })
      return result[0]
    }

    const auctionBody = (feeCategoryId: string) => ({
      fee_category_id: feeCategoryId,
      start_at: new Date(Date.now() + DAY).toISOString(),
      end_at: new Date(Date.now() + 3 * DAY).toISOString(),
      delivery_method: "courier",
      lots: [
        {
          title: `Kohaku ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: "Maruten bersih.",
          photos: ["http://localhost:9000/static/koi.jpg"],
          ob: 1_000_000,
          kb: 100_000,
          // US-105 (D-081): required on every new lot.
          variety: "Kohaku",
          size_cm: 55,
        },
      ],
    })

    // A draft auction, owned by `vendor`.
    const createAuction = async (vendor: Record<string, string>) => {
      const category = await createCategory()
      const created = await api.post("/vendor/auctions", auctionBody(category.id), { headers: vendor })
      expect(created.status).toEqual(201)
      return created.data.auction as { id: string; lots: { id: string }[] }
    }

    // draft → pending_approval → scheduled (the listing fee charged).
    const scheduledAuction = async (farm: { vendor: Record<string, string> }) => {
      const auction = await createAuction(farm.vendor)
      expect((await api.post(`/vendor/auctions/${auction.id}/submit`, {}, { headers: farm.vendor })).status).toEqual(200)
      const approved = await api.post(
        `/admin/auctions/${auction.id}/approve`,
        {},
        { headers: admin }
      )
      expect(approved.status).toEqual(200)
      return auction
    }

    // A customer with a customer-token header and `balance` rupiah in a wallet.
    const buyer = async (balance: number) => {
      const container = getContainer()
      const [row] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
            first_name: "Siti",
            last_name: "Rahmawati",
            phone: BUYER_PHONE,
          },
        ])
      const [wallet] = await wallets().createWallets([{}])
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CUSTOMER]: { customer_id: row.id },
        [WALLET_MODULE]: { wallet_id: wallet.id },
      })
      if (balance > 0) {
        await wallets().createWalletTransactions([
          { wallet_id: wallet.id, type: "manual_topup", amount: balance, reference: "test" },
        ])
      }
      return {
        id: row.id,
        email: row.email,
        walletId: wallet.id as string,
        headers: {
          authorization: `Bearer ${jwt(container, row.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    const join = async (lotId: string, headers: Record<string, string>) => {
      const res = await api.post(`/store/lots/${lotId}/join`, {}, { headers })
      expect(res.status).toEqual(201)
    }

    const cancel = (headers: Record<string, string>, auctionId: string, body: unknown = {}) =>
      api.post(`/vendor/auctions/${auctionId}/cancel`, body, { headers })

    const ledgerOf = (walletId: string) => wallets().listWalletTransactions({ wallet_id: walletId })
    const balanceOf = async (walletId: string) =>
      (await ledgerOf(walletId)).reduce((sum, t) => sum + Number(t.amount), 0)
    const refundsFor = async (auctionId: string) =>
      (await wallets().listWalletTransactions()).filter(
        (t) => t.type === "refund" && t.reference === auctionId
      )
    const statusOf = async (auctionId: string) =>
      (await auctions().retrieveAuction(auctionId)).status
    const lotOf = async (lotId: string) => auctions().retrieveLot(lotId)

    beforeEach(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token

      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `cancel-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    it("cancels a scheduled auction, refunding exactly each joiner's own join fee (AC1, AC3)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const first = await buyer(150_000)
      const second = await buyer(150_000)
      await join(auction.lots[0].id, first.headers)
      await join(auction.lots[0].id, second.headers)

      const before = {
        first: await balanceOf(first.walletId),
        second: await balanceOf(second.walletId),
        ledger: (await wallets().listWalletTransactions()).length,
      }

      const res = await cancel(farm.vendor, auction.id)
      expect(res.status).toEqual(200)
      expect(res.data.auction).toMatchObject({ id: auction.id, seller_id: farm.seller.id, status: "cancelled" })
      expect(res.data.refund).toEqual({ participants: 2, total: 200_000 })

      expect(await statusOf(auction.id)).toEqual("cancelled")
      const refunds = await refundsFor(auction.id)
      expect(refunds).toHaveLength(2)
      expect(refunds.map((r) => Number(r.amount)).sort()).toEqual([100_000, 100_000])
      expect(refunds.map((r) => r.wallet_id).sort()).toEqual([first.walletId, second.walletId].sort())
      expect(refunds.every((r) => r.created_by === "refund")).toBe(true)

      // Balances rise by exactly the refunded fees (150k − 100k + 100k).
      expect(await balanceOf(first.walletId)).toEqual(before.first + 100_000)
      expect(await balanceOf(second.walletId)).toEqual(before.second + 100_000)
      expect(await balanceOf(first.walletId) + (await balanceOf(second.walletId))).toEqual(
        before.first + before.second + 200_000
      )
      // One batched append: exactly two new rows.
      expect((await wallets().listWalletTransactions()).length).toEqual(before.ledger + 2)

      // AC2: the listing fee row stays; no listing-fee refund exists.
      const listing = (await ledgerOf(farm.walletId)).filter(
        (t) => t.reference === auction.id && t.type === "listing_fee"
      )
      expect(listing).toHaveLength(1)
      expect(
        (await wallets().listWalletTransactions()).filter(
          (t) => t.reference === auction.id && t.type === "listing_fee" && Number(t.amount) > 0
        )
      ).toHaveLength(0)

      // D-035: the lots are untouched and stay `open`, with no winner.
      const lot = await lotOf(auction.lots[0].id)
      expect(lot.status).toEqual("open")
      expect(lot.winner_customer_id).toBeNull()
      expect(lot.final_price).toBeNull()
      // The close job skips a lot of a cancelled auction.
      const closed = await closeLotWorkflow(getContainer()).run({ input: { lot_id: lot.id } })
      expect(closed.result.status).toBeNull()
      expect((await lotOf(lot.id)).status).toEqual("open")

      // No PII in the response.
      const body = JSON.stringify(res.data)
      for (const secret of [first.id, second.id, first.email, second.email, FARMER_PHONE, BUYER_PHONE]) {
        expect(body).not.toContain(secret)
      }
      expect(res.data.auction).not.toHaveProperty("participants")
    })

    // US-111 fix round: a farmer cancel leaves the lots `open` (D-035), so an
    // admin can still cancel a lot afterwards. Its joins were already refunded
    // under the auction id; the lot cancel must append nothing more.
    it("writes no second refund when a lot is cancelled after the auction", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      expect((await cancel(farm.vendor, auction.id)).status).toEqual(200)
      expect(await refundsFor(auction.id)).toHaveLength(1)

      const res = await api.post(
        `/admin/lots/${auction.lots[0].id}/cancel`,
        { reason: "Ikan sakit." },
        { headers: admin }
      )
      expect(res.status).toEqual(200)
      expect(res.data.lot.status).toEqual("cancelled")
      expect(
        (await wallets().listWalletTransactions()).filter(
          (t) => t.type === "refund"
        )
      ).toHaveLength(1)
      expect(await balanceOf(joiner.walletId)).toEqual(150_000)
    })

    it("cancels a draft with no participants: no refund, no ledger row (AC1)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await createAuction(farm.vendor)
      const before = (await wallets().listWalletTransactions()).length

      const res = await cancel(farm.vendor, auction.id)
      expect(res.status).toEqual(200)
      expect(res.data.auction.status).toEqual("cancelled")
      expect(res.data.refund).toEqual({ participants: 0, total: 0 })
      expect((await wallets().listWalletTransactions()).length).toEqual(before)
      expect(await refundsFor(auction.id)).toHaveLength(0)
    })

    it("cancels a pending_approval auction and refunds a joiner (AC1, AC3)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await createAuction(farm.vendor)
      expect((await api.post(`/vendor/auctions/${auction.id}/submit`, {}, { headers: farm.vendor })).status).toEqual(200)
      expect(await statusOf(auction.id)).toEqual("pending_approval")

      const joiner = await buyer(150_000)
      // Joining needs `scheduled`/`live` (D-048): seed the participant and its
      // charge the way the join workflow writes them, then put it back.
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])
      await join(auction.lots[0].id, joiner.headers)
      await auctions().updateAuctions([{ id: auction.id, status: "pending_approval" }])

      const res = await cancel(farm.vendor, auction.id)
      expect(res.status).toEqual(200)
      expect(res.data.auction.status).toEqual("cancelled")
      expect(res.data.refund).toEqual({ participants: 1, total: 100_000 })
      expect((await refundsFor(auction.id)).map((r) => Number(r.amount))).toEqual([100_000])
    })

    it("writes no refund for an Rp0 join, and refunds only the paid one (AC1)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const paid = await buyer(150_000)
      const free = await buyer(0)
      // The paid joiner charges at the real fee; the override then lets the
      // second join at Rp0, which writes no `join_fee` row.
      await join(auction.lots[0].id, paid.headers)
      await auctions().updateAuctions([{ id: auction.id, fee_override_join_fee: 0 }])
      await join(auction.lots[0].id, free.headers)
      expect(
        (await ledgerOf(free.walletId)).filter(
          (t) => t.type === "join_fee" && t.reference === auction.lots[0].id
        )
      ).toHaveLength(0)

      const res = await cancel(farm.vendor, auction.id)
      expect(res.status).toEqual(200)
      expect(res.data.refund).toEqual({ participants: 1, total: 100_000 })
      const rows = await refundsFor(auction.id)
      expect(rows).toHaveLength(1)
      expect(rows[0].wallet_id).toEqual(paid.walletId)
      expect(Number(rows[0].amount)).toEqual(100_000)
    })

    it("refuses live, closed and cancelled auctions with 409 and writes nothing (AC3)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      for (const status of ["live", "closed", "cancelled"] as const) {
        const auction = await createAuction(farm.vendor)
        await auctions().updateAuctions([{ id: auction.id, status }])
        const before = (await wallets().listWalletTransactions()).length

        const refused = await failure(cancel(farm.vendor, auction.id))
        expect(refused.status).toEqual(409)
        expect(await statusOf(auction.id)).toEqual(status)
        expect(await refundsFor(auction.id)).toHaveLength(0)
        expect((await wallets().listWalletTransactions()).length).toEqual(before)
      }
    })

    it("refuses a second cancel with 409: no second refund batch (AC1, AC3)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      expect((await cancel(farm.vendor, auction.id)).status).toEqual(200)
      const refused = await failure(cancel(farm.vendor, auction.id))
      expect(refused.status).toEqual(409)
      expect(await refundsFor(auction.id)).toHaveLength(1)
      expect(await statusOf(auction.id)).toEqual("cancelled")
    })

    it("404s another farm's auction and an unknown id, writing nothing", async () => {
      const owner = await registerFarm({ balance: 1_000_000 })
      const other = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(owner)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      const notMine = await failure(cancel(other.vendor, auction.id))
      expect(notMine.status).toEqual(404)
      expect(notMine.data.message).toEqual("Lelang tidak ditemukan.")
      expect(await statusOf(auction.id)).toEqual("scheduled")
      expect(await refundsFor(auction.id)).toHaveLength(0)

      expect((await failure(cancel(owner.vendor, "auct_does_not_exist"))).status).toEqual(404)
    })

    it("refuses pending, suspended and terminated farms with 403 (D-054)", async () => {
      const container = getContainer()
      const pending = await registerFarm({ approve: false })
      const pendingAuction = await auctions().createAuctions([
        {
          seller_id: pending.seller.id,
          fee_category_id: "feecat_cancel",
          start_at: new Date(Date.now() + DAY),
          end_at: new Date(Date.now() + 3 * DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 100_000,
          extend_window_minutes: 5,
          status: "scheduled",
        },
      ])
      expect((await failure(cancel(pending.vendor, pendingAuction[0].id))).status).toEqual(403)
      expect(await statusOf(pendingAuction[0].id)).toEqual("scheduled")

      const suspended = await registerFarm({ balance: 1_000_000 })
      const suspendedAuction = await scheduledAuction(suspended)
      await suspendSellerWorkflow(container).run({
        input: { seller_id: suspended.seller.id, reason: "qa suspend" },
      })
      expect((await failure(cancel(suspended.vendor, suspendedAuction.id))).status).toEqual(403)
      expect(await statusOf(suspendedAuction.id)).toEqual("scheduled")

      const terminated = await registerFarm({ balance: 1_000_000 })
      const terminatedAuction = await scheduledAuction(terminated)
      // Mercur refuses to terminate an open farm: suspend first.
      await suspendSellerWorkflow(container).run({
        input: { seller_id: terminated.seller.id, reason: "qa suspend" },
      })
      await terminateSellerWorkflow(container).run({
        input: { seller_id: terminated.seller.id, reason: "qa terminate" },
      })
      expect((await failure(cancel(terminated.vendor, terminatedAuction.id))).status).toEqual(403)
      expect(await statusOf(terminatedAuction.id)).toEqual("scheduled")
    })

    it("refuses a non-empty body with 400 and writes nothing (thin route)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      const refused = await failure(cancel(farm.vendor, auction.id, { status: "cancelled" }))
      expect(refused.status).toEqual(400)
      expect(refused.data.message).toEqual("Pembatalan tidak memakai body.")
      expect(await statusOf(auction.id)).toEqual("scheduled")
      expect(await refundsFor(auction.id)).toHaveLength(0)
    })

    it("restores the status and writes no refund row when the refund insert fails (append-only)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      const spy = jest
        .spyOn(wallets(), "createWalletTransactions")
        .mockRejectedValueOnce(new Error("simulated refund failure"))

      const failed = await failure(cancel(farm.vendor, auction.id))
      spy.mockRestore()
      expect(failed.status).toEqual(500)

      // The status step compensated back; no refund batch exists.
      expect(await statusOf(auction.id)).toEqual("scheduled")
      expect(await refundsFor(auction.id)).toHaveLength(0)

      // A retry refunds exactly once.
      expect((await cancel(farm.vendor, auction.id)).status).toEqual(200)
      expect(await refundsFor(auction.id)).toHaveLength(1)
    })

    it("writes no refund row when the status step itself fails (US-060 AC1)", async () => {
      const farm = await registerFarm({ balance: 1_000_000 })
      const auction = await scheduledAuction(farm)
      const joiner = await buyer(150_000)
      await join(auction.lots[0].id, joiner.headers)

      const spy = jest
        .spyOn(auctions(), "updateAuctions")
        .mockRejectedValueOnce(new Error("simulated status failure"))

      const failed = await failure(cancel(farm.vendor, auction.id))
      spy.mockRestore()
      expect(failed.status).toEqual(500)

      expect(await statusOf(auction.id)).toEqual("scheduled")
      expect(await refundsFor(auction.id)).toHaveLength(0)
    })
  },
})
