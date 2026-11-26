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

// US-111 T-111.1 (AC1, AC5, D-070, D-080): joining one lot — one
// (customer, lot) participant, one `join_fee` (−) referencing the lot, under
// the lot and wallet locks. A join made per auction before US-111 keeps
// access to every lot of that auction (D-080).

const DAY = 24 * 60 * 60 * 1000
const OB = 1_000_000
const KB = 100_000
type HttpResponse = { status: number; data: { code?: string; message?: string } }

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const jwt = (container: MedusaContainer, actor_id: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type: "customer",
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

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    // A customer, optionally with a wallet holding `balance` rupiah.
    const customer = async (balance: number | null) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email: `join-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev` },
      ])
      const auth = {
        authorization: `Bearer ${jwt(container, row.id)}`,
        "x-publishable-api-key": publishable,
      }
      if (balance === null) {
        return { id: row.id, auth, walletId: null as string | null }
      }
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
      return { id: row.id, auth, walletId: wallet.id as string | null }
    }

    const auction = async (
      overrides: Partial<{
        status: "draft" | "pending_approval" | "scheduled" | "live" | "closed" | "cancelled"
        join_fee: number
        fee_override_join_fee: number | null
        payer_customer_id: string | null
        start_at: Date
        end_at: Date
      }> = {}
    ) => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_join",
          fee_category_id: "feecat_join",
          start_at: overrides.start_at ?? new Date(Date.now() - DAY),
          end_at: overrides.end_at ?? new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: overrides.join_fee ?? 100_000,
          extend_window_minutes: 5,
          status: overrides.status ?? "live",
          payer_customer_id: overrides.payer_customer_id ?? "cus_farmer",
          fee_override_join_fee: overrides.fee_override_join_fee ?? null,
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      overrides: Partial<{
        status: "open" | "won" | "cancelled"
        end_time: Date
      }> = {}
    ) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_join",
          ob: OB,
          kb: KB,
          current_price: OB,
          end_time: overrides.end_time ?? new Date(Date.now() + DAY),
          status: overrides.status ?? "open",
        },
      ])
      return row
    }

    const joinFeeRows = async (walletId: string) =>
      (await wallets().listWalletTransactions({ wallet_id: walletId })).filter(
        (t) => t.type === "join_fee"
      )
    const balanceOf = async (walletId: string) =>
      (await wallets().listWalletTransactions({ wallet_id: walletId })).reduce(
        (sum, t) => sum + Number(t.amount),
        0
      )
    const lotParticipants = (lotId: string) =>
      auctions().listLotParticipants({ lot_id: lotId })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("joins one lot: one participant and exactly one join_fee at the fee, referencing the lot (AC1)", async () => {
      const { id: customerId, auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      const joined = await api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      expect(joined.status).toEqual(201)
      expect(joined.data.participant).toMatchObject({ lot_id: seeded.id })
      expect(joined.data.wallet_transaction_id).toEqual(expect.any(String))

      expect(await lotParticipants(seeded.id)).toMatchObject([
        { customer_id: customerId, paid_join_fee: 100_000 },
      ])
      const fees = await joinFeeRows(walletId!)
      expect(fees).toHaveLength(1)
      expect(fees[0]).toMatchObject({
        type: "join_fee",
        amount: -100_000,
        reference: seeded.id,
        created_by: customerId,
      })
      expect(await balanceOf(walletId!)).toEqual(50_000)
    })

    it("charges once per lot: two lots of one auction cost two fees (AC1, D-070)", async () => {
      const { auth, walletId } = await customer(250_000)
      const { id: auctionId } = await auction()
      const first = await lot(auctionId)
      const second = await lot(auctionId)

      expect(
        (await api.post(`/store/lots/${first.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      expect(
        (await api.post(`/store/lots/${second.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)

      expect(await lotParticipants(first.id)).toHaveLength(1)
      expect(await lotParticipants(second.id)).toHaveLength(1)
      const fees = await joinFeeRows(walletId!)
      expect(fees).toHaveLength(2)
      expect(fees.map((t) => t.reference).sort()).toEqual([first.id, second.id].sort())
      expect(await balanceOf(walletId!)).toEqual(50_000)
    })

    it("allows a scheduled auction and a live one past end_at (AC1, D-048)", async () => {
      const { auth } = await customer(250_000)
      const scheduled = await auction({ status: "scheduled" })
      const past = await auction({
        start_at: new Date(Date.now() - 2 * DAY),
        end_at: new Date(Date.now() - DAY),
      })
      const scheduledLot = await lot(scheduled.id)
      const pastLot = await lot(past.id)

      expect(
        (await api.post(`/store/lots/${scheduledLot.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      expect(
        (await api.post(`/store/lots/${pastLot.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
    })

    it("charges only once per lot: a second join is 409 and writes no second row (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      expect(
        (await api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(409)
      expect(refused.data.code).toEqual("invalid_state_error")
      expect(await joinFeeRows(walletId!)).toHaveLength(1)
      expect(await balanceOf(walletId!)).toEqual(50_000)
    })

    it("serialises two concurrent joins of the same lot: one 201, one 409, one charge (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      const results = await Promise.allSettled([
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth }),
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth }),
      ])
      const statuses = results
        .map((r) =>
          r.status === "fulfilled"
            ? (r.value as { status: number }).status
            : (r.reason as { response: HttpResponse }).response.status
        )
        .sort()
      expect(statuses).toEqual([201, 409])
      expect(await joinFeeRows(walletId!)).toHaveLength(1)
      expect(await lotParticipants(seeded.id)).toHaveLength(1)
    })

    it("blocks a short balance with nothing written (AC1)", async () => {
      const { auth, walletId } = await customer(40_000)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")
      // D-055: Indonesian, id-ID rupiah, shown verbatim.
      expect(refused.data.message).toEqual(
        "Saldo Rp40.000 kurang dari biaya ikut lelang Rp100.000."
      )
      expect(await lotParticipants(seeded.id)).toHaveLength(0)
      expect(await joinFeeRows(walletId!)).toHaveLength(0)
      expect(await balanceOf(walletId!)).toEqual(40_000)
    })

    it("treats no wallet as Rp0 (AC1, D-011)", async () => {
      const { auth } = await customer(null)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")
      expect(refused.data.message).toEqual(
        "Saldo Rp0 kurang dari biaya ikut lelang Rp100.000."
      )
      expect(await lotParticipants(seeded.id)).toHaveLength(0)
    })

    it("charges the override fee when one is set (D-032)", async () => {
      const { auth, walletId } = await customer(60_000)
      const { id: auctionId } = await auction({
        join_fee: 100_000,
        fee_override_join_fee: 50_000,
      })
      const seeded = await lot(auctionId)

      expect(
        (await api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      expect((await joinFeeRows(walletId!)).map((t) => Number(t.amount))).toEqual([-50_000])
      expect(await balanceOf(walletId!)).toEqual(10_000)
    })

    it("refuses the farmer joining their own auction (AC1, D-033)", async () => {
      const { id: customerId, auth } = await customer(150_000)
      const { id: auctionId } = await auction({ payer_customer_id: customerId })
      const seeded = await lot(auctionId)

      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(403)
      expect(refused.data.code).toEqual("own_auction")
      expect(await lotParticipants(seeded.id)).toHaveLength(0)
    })

    it("refuses a lot whose auction is draft, pending_approval, closed or cancelled (AC1)", async () => {
      const { auth } = await customer(500_000)
      for (const status of ["draft", "pending_approval", "closed", "cancelled"] as const) {
        const { id: auctionId } = await auction({ status })
        const seeded = await lot(auctionId)
        const refused = await failure(
          api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
        )
        expect(refused.status).toEqual(409)
        expect(await lotParticipants(seeded.id)).toHaveLength(0)
      }
    })

    it("refuses a lot that is not open (AC1)", async () => {
      const { auth } = await customer(200_000)
      const { id: auctionId } = await auction()
      for (const status of ["won", "cancelled"] as const) {
        const seeded = await lot(auctionId, { status })
        const refused = await failure(
          api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
        )
        expect(refused.status).toEqual(409)
        expect(await lotParticipants(seeded.id)).toHaveLength(0)
      }
    })

    it("requires a customer token (AC1)", async () => {
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)
      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, {}, {
          headers: { "x-publishable-api-key": publishable },
        })
      )
      expect(refused.status).toEqual(401)
    })

    it("refuses a body: identity and amount are server-side (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()
      const seeded = await lot(auctionId)

      const refused = await failure(
        api.post(`/store/lots/${seeded.id}/join`, { customer_id: "cus_other" }, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(await lotParticipants(seeded.id)).toHaveLength(0)
      expect(await joinFeeRows(walletId!)).toHaveLength(0)
    })

    it("GET reports joined and the fee (AC1)", async () => {
      const { auth } = await customer(150_000)
      const { id: auctionId } = await auction({ fee_override_join_fee: 75_000 })
      const seeded = await lot(auctionId)

      const before = await api.get(`/store/lots/${seeded.id}/join`, { headers: auth })
      expect(before.status).toEqual(200)
      expect(before.data).toEqual({ joined: false, join_fee: 75_000 })

      await api.post(`/store/lots/${seeded.id}/join`, {}, { headers: auth })
      const after = await api.get(`/store/lots/${seeded.id}/join`, { headers: auth })
      expect(after.data).toEqual({ joined: true, join_fee: 75_000 })

      expect(
        (await failure(api.get("/store/lots/lot_missing/join", { headers: auth }))).status
      ).toEqual(404)
    })

    it("AC2: a bid needs a join on that lot, not just on its auction", async () => {
      const { auth } = await customer(250_000)
      const { id: auctionId } = await auction()
      const joined = await lot(auctionId)
      const other = await lot(auctionId)
      await api.post(`/store/lots/${joined.id}/join`, {}, { headers: auth })

      const ok = await api.post(
        "/store/bids",
        { lot_id: joined.id, amount: OB },
        { headers: auth }
      )
      expect(ok.status).toEqual(201)

      const refused = await failure(
        api.post("/store/bids", { lot_id: other.id, amount: OB }, { headers: auth })
      )
      expect(refused.status).toEqual(403)
      expect(refused.data.code).toEqual("not_participant")
    })

    it("AC5 / D-080: a pre-US-111 auction-wide join reaches every lot with no new charge", async () => {
      const { id: customerId, auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()
      const first = await lot(auctionId)
      const second = await lot(auctionId)
      // The old rule's row: one auction-wide participant, one charge.
      await auctions().createAuctionParticipants([
        { auction_id: auctionId, customer_id: customerId },
      ])
      await wallets().createWalletTransactions([
        {
          wallet_id: walletId!,
          type: "join_fee",
          amount: -100_000,
          reference: auctionId,
          created_by: customerId,
        },
      ])

      const state = await api.get(`/store/lots/${first.id}/join`, { headers: auth })
      expect(state.data).toEqual({ joined: true, join_fee: 100_000 })

      // No second charge: the join is refused as already joined.
      expect(
        (await failure(api.post(`/store/lots/${first.id}/join`, {}, { headers: auth }))).status
      ).toEqual(409)
      expect(await joinFeeRows(walletId!)).toHaveLength(1)
      expect(await balanceOf(walletId!)).toEqual(50_000)

      // Both lots accept a bid under the carry-over.
      for (const seeded of [first, second]) {
        const bid = await api.post(
          "/store/bids",
          { lot_id: seeded.id, amount: OB },
          { headers: auth }
        )
        expect(bid.status).toEqual(201)
      }
    })
  },
})
