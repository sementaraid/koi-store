import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"

jest.setTimeout(120 * 1000)

// US-091 T-091.1b (AC2, AC3, D-020, D-022, D-034, D-035, D-055): the admin
// cancels a `live` auction. Each participant's own recorded `join_fee` comes
// back as a `refund` (+) row; the listing fee never does; the open lots are
// `cancelled` with the same reason, a `won` lot is untouched.

const DAY = 24 * 60 * 60 * 1000
const JOIN_FEE = 100_000
const LISTING_FEE = 50_000
const OB = 100_000

type HttpResponse = {
  status: number
  data: { code?: string; message?: string; [key: string]: unknown }
}

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
    { actor_id, actor_type, auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)
    const query = () =>
      getContainer().resolve(ContainerRegistrationKeys.QUERY)

    const customer = async (balance: number) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
        },
      ])
      const [wallet] = await wallets().createWallets([{}])
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CUSTOMER]: { customer_id: row.id },
        [WALLET_MODULE]: { wallet_id: wallet.id },
      })
      if (balance > 0) {
        await wallets().createWalletTransactions([
          {
            wallet_id: wallet.id,
            type: "manual_topup",
            amount: balance,
            reference: "test",
          },
        ])
      }
      return {
        id: row.id as string,
        walletId: wallet.id as string,
        headers: {
          authorization: `Bearer ${jwt(container, row.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    const auction = async (status = "live") => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_cancel",
          fee_category_id: "feecat_cancel",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: LISTING_FEE,
          join_fee: JOIN_FEE,
          extend_window_minutes: 5,
          status: status as never,
          payer_customer_id: "cus_farmer",
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      overrides: {
        status?: string
        winner_customer_id?: string | null
        final_price?: number | null
      } = {}
    ) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_cancel",
          ob: OB,
          kb: 10_000,
          current_price: OB,
          end_time: new Date(Date.now() + DAY),
          status: (overrides.status ?? "open") as never,
          winner_customer_id: overrides.winner_customer_id ?? null,
          final_price: overrides.final_price ?? null,
        },
      ])
      return row
    }

    // The listing fee the approve workflow charges: one `listing_fee` (−) row.
    const chargeListingFee = async (auctionId: string) => {
      const [wallet] = await wallets().createWallets([{}])
      await wallets().createWalletTransactions([
        {
          wallet_id: wallet.id,
          type: "listing_fee",
          amount: -LISTING_FEE,
          reference: auctionId,
          created_by: "cus_farmer",
        },
      ])
      return wallet.id as string
    }

    const join = async (auctionId: string, headers: Record<string, string>) => {
      const res = await api.post(`/store/auctions/${auctionId}/join`, {}, { headers })
      expect(res.status).toEqual(201)
    }

    const cancel = (
      auctionId: string,
      body: unknown = { reason: "Ikan sakit." },
      headers: Record<string, string> = admin
    ) => api.post(`/admin/auctions/${auctionId}/cancel`, body, { headers })

    const ledgerOf = (walletId: string) =>
      wallets().listWalletTransactions({ wallet_id: walletId })
    const balanceOf = async (walletId: string) =>
      (await ledgerOf(walletId)).reduce((sum, t) => sum + Number(t.amount), 0)
    const refundsFor = async (auctionId: string) =>
      (await wallets().listWalletTransactions()).filter(
        (t) => t.type === "refund" && t.reference === auctionId
      )
    const storedAuction = (id: string) =>
      auctions().retrieveAuction(id) as Promise<{
        status: string
        cancel_reason: string | null
      }>
    const storedLot = (id: string) =>
      auctions().retrieveLot(id) as Promise<{
        status: string
        cancel_reason: string | null
        winner_customer_id: string | null
        final_price: number | null
        current_price: number
      }>

    // A live auction with a listing fee, 3 open lots, 1 won lot, and two
    // participants who each paid a real join fee.
    const ready = async () => {
      const event = await auction()
      const farmerWallet = await chargeListingFee(event.id)
      const open = [
        await lot(event.id),
        await lot(event.id),
        await lot(event.id),
      ]
      const won = await lot(event.id, {
        status: "won",
        winner_customer_id: "cus_winner",
        final_price: 250_000,
      })
      const first = await customer(150_000)
      const second = await customer(150_000)
      await join(event.id, first.headers)
      await join(event.id, second.headers)
      return { event, farmerWallet, open, won, first, second }
    }

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `cancel-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("cancels a live auction, refunding exactly each participant's join fee (AC2, AC3)", async () => {
      const { event, farmerWallet, first, second } = await ready()
      const before = {
        first: await balanceOf(first.walletId),
        second: await balanceOf(second.walletId),
        ledger: (await wallets().listWalletTransactions()).length,
      }

      const res = await cancel(event.id)
      expect(res.status).toEqual(200)
      expect(res.data.auction).toEqual({
        id: event.id,
        status: "cancelled",
        cancel_reason: "Ikan sakit.",
      })
      expect(res.data.refund).toEqual({
        participants: 2,
        total: JOIN_FEE * 2,
      })

      const stored = await storedAuction(event.id)
      expect(stored.status).toEqual("cancelled")
      expect(stored.cancel_reason).toEqual("Ikan sakit.")

      const refunds = await refundsFor(event.id)
      expect(refunds).toHaveLength(2)
      expect(refunds.map((r) => Number(r.amount)).sort()).toEqual([JOIN_FEE, JOIN_FEE])
      expect(refunds.map((r) => r.wallet_id).sort()).toEqual(
        [first.walletId, second.walletId].sort()
      )
      expect(refunds.every((r) => r.created_by === "refund")).toBe(true)

      // Balances rise by exactly the refunded fees.
      expect(await balanceOf(first.walletId)).toEqual(before.first + JOIN_FEE)
      expect(await balanceOf(second.walletId)).toEqual(before.second + JOIN_FEE)
      // One batched append: exactly two new rows.
      expect((await wallets().listWalletTransactions()).length).toEqual(
        before.ledger + 2
      )

      // The listing fee row stays; no listing-fee refund exists.
      const listing = (await ledgerOf(farmerWallet)).filter(
        (t) => t.reference === event.id && t.type === "listing_fee"
      )
      expect(listing).toHaveLength(1)
      expect(
        (await wallets().listWalletTransactions()).filter(
          (t) => t.reference === event.id && Number(t.amount) > 0
        )
      ).toHaveLength(2)
    })

    it("cancels only the open lots; the won lot keeps status, winner and price (AC2, D-035)", async () => {
      const { event, open, won } = await ready()

      expect((await cancel(event.id)).status).toEqual(200)

      for (const seeded of open) {
        const stored = await storedLot(seeded.id)
        expect(stored.status).toEqual("cancelled")
        expect(stored.cancel_reason).toEqual("Ikan sakit.")
        expect(stored.winner_customer_id).toBeNull()
        expect(stored.final_price).toBeNull()
      }

      const storedWon = await storedLot(won.id)
      expect(storedWon.status).toEqual("won")
      expect(storedWon.cancel_reason).toBeNull()
      expect(storedWon.winner_customer_id).toEqual("cus_winner")
      expect(storedWon.final_price).toEqual(250_000)
    })

    it("writes no refund for a Rp0 join (AC3)", async () => {
      const { event, first } = await ready()
      const free = await customer(0)
      await auctions().updateAuctions([
        { id: event.id, fee_override_join_fee: 0 },
      ])
      await join(event.id, free.headers)
      expect(
        (await ledgerOf(free.walletId)).filter(
          (t) => t.type === "join_fee" && t.reference === event.id
        )
      ).toHaveLength(0)

      const res = await cancel(event.id)
      expect(res.status).toEqual(200)
      expect(res.data.refund).toEqual({
        participants: 2,
        total: JOIN_FEE * 2,
      })
      const rows = await refundsFor(event.id)
      expect(rows).toHaveLength(2)
      expect(rows.some((r) => r.wallet_id === first.walletId)).toBe(true)
      expect(rows.some((r) => r.wallet_id === free.walletId)).toBe(false)
    })

    it("409s every status but live and writes nothing (AC2, D-022)", async () => {
      for (const status of [
        "draft",
        "pending_approval",
        "scheduled",
        "closed",
        "cancelled",
      ] as const) {
        const event = await auction(status)
        const [wallet] = await wallets().createWallets([{}])
        const other = await customer(0)
        await auctions().createAuctionParticipants([
          { auction_id: event.id, customer_id: other.id },
        ])
        const before = (await wallets().listWalletTransactions()).length

        const refused = await failure(cancel(event.id))
        expect(refused.status).toEqual(409)
        // Medusa's handler replaces the CONFLICT code/message at HTTP level;
        // the step's `auction_not_cancellable` stays for internal callers.
        const stored = await storedAuction(event.id)
        expect(stored.status).toEqual(status)
        expect(stored.cancel_reason).toBeNull()
        expect(await refundsFor(event.id)).toHaveLength(0)
        expect((await wallets().listWalletTransactions()).length).toEqual(before)
        // Unused wallet keeps the check honest about a stray write.
        expect(await balanceOf(wallet.id)).toEqual(0)
      }
    })

    it("404s an unknown id and 400s a blank or absent reason (D-055)", async () => {
      const { event } = await ready()

      expect((await failure(cancel("auct_does_not_exist"))).status).toEqual(404)
      for (const body of [{}, { reason: "" }, { reason: "   " }]) {
        const res = await failure(cancel(event.id, body))
        expect(res.status).toEqual(400)
        expect(res.data.message).toContain("Alasan pembatalan wajib diisi.")
      }
      expect((await storedAuction(event.id)).status).toEqual("live")
      expect(await refundsFor(event.id)).toHaveLength(0)
    })

    it("401s an anonymous caller and a customer token (D-002)", async () => {
      const { event, first } = await ready()
      const customerHeader = {
        authorization: `Bearer ${jwt(getContainer(), first.id, "customer")}`,
      }

      expect((await failure(cancel(event.id, undefined, {}))).status).toEqual(401)
      expect(
        (await failure(cancel(event.id, undefined, customerHeader))).status
      ).toEqual(401)
      expect((await storedAuction(event.id)).status).toEqual("live")
    })

    it("restores the auction and the lots when the refund insert fails (AC3, append-only)", async () => {
      const { event, open } = await ready()
      const spy = jest
        .spyOn(wallets(), "createWalletTransactions")
        .mockRejectedValueOnce(new Error("simulated refund failure"))

      const failed = await failure(cancel(event.id))
      spy.mockRestore()
      expect(failed.status).toEqual(500)

      const stored = await storedAuction(event.id)
      expect(stored.status).toEqual("live")
      expect(stored.cancel_reason).toBeNull()
      for (const seeded of open) {
        const row = await storedLot(seeded.id)
        expect(row.status).toEqual("open")
        expect(row.cancel_reason).toBeNull()
      }
      expect(await refundsFor(event.id)).toHaveLength(0)

      // A retry refunds exactly once.
      expect((await cancel(event.id)).status).toEqual(200)
      expect(await refundsFor(event.id)).toHaveLength(2)
    })

    it("writes no adjustment, payout or bid change (AC3, D-020)", async () => {
      const { event, open } = await ready()
      const [bid] = await auctions().createBids([
        { lot_id: open[0].id, customer_id: "cus_bidder", amount: 150_000, source: "web" },
      ])
      const before = (await wallets().listWalletTransactions()).length

      expect((await cancel(event.id)).status).toEqual(200)

      const all = await wallets().listWalletTransactions()
      expect(all.filter((t) => t.type === "adjustment")).toHaveLength(0)
      // The listing fee row, the two joins and the two refunds: nothing else.
      expect(all.length).toEqual(before + 2)

      const {
        data: [storedBid],
      } = await query().graph({
        entity: "bid",
        fields: ["id", "amount", "customer_id"],
        filters: { id: bid.id },
      })
      expect(storedBid).toMatchObject({
        id: bid.id,
        amount: 150_000,
        customer_id: "cus_bidder",
      })
    })

    it("409s a second cancel with one refund batch only (AC2)", async () => {
      const { event } = await ready()
      expect((await cancel(event.id)).status).toEqual(200)

      const refused = await failure(cancel(event.id))
      expect(refused.status).toEqual(409)
      expect((await storedAuction(event.id)).status).toEqual("cancelled")
      expect(await refundsFor(event.id)).toHaveLength(2)
    })
  },
})
