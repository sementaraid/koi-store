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

// US-041 T-041.1b: joining an auction — one participant, one `join_fee` (−),
// under the wallet lock. AC1–AC4 (D-032, D-033, D-047, D-048).

const DAY = 24 * 60 * 60 * 1000
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

    const joinFeeRows = async (walletId: string) =>
      (await wallets().listWalletTransactions({ wallet_id: walletId })).filter(
        (t) => t.type === "join_fee"
      )
    const balanceOf = async (walletId: string) =>
      (await wallets().listWalletTransactions({ wallet_id: walletId })).reduce(
        (sum, t) => sum + Number(t.amount),
        0
      )
    const participants = (auctionId: string) =>
      auctions().listAuctionParticipants({ auction_id: auctionId })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("joins a live auction: one participant and exactly one join_fee at the fee (AC1)", async () => {
      const { id: customerId, auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()

      const joined = await api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      expect(joined.status).toEqual(201)
      expect(joined.data.participant).toMatchObject({ auction_id: auctionId })
      expect(joined.data.wallet_transaction_id).toEqual(expect.any(String))

      expect(await participants(auctionId)).toMatchObject([{ customer_id: customerId }])
      const fees = await joinFeeRows(walletId!)
      expect(fees).toHaveLength(1)
      expect(fees[0]).toMatchObject({
        type: "join_fee",
        amount: -100_000,
        reference: auctionId,
        created_by: customerId,
      })
      expect(await balanceOf(walletId!)).toEqual(50_000)
    })

    it("allows a scheduled auction and a live one past end_at (AC3, D-048)", async () => {
      // Two fees' worth for the two joins.
      const { auth } = await customer(250_000)
      const scheduled = await auction({ status: "scheduled" })
      const past = await auction({
        start_at: new Date(Date.now() - 2 * DAY),
        end_at: new Date(Date.now() - DAY),
      })

      expect(
        (await api.post(`/store/auctions/${scheduled.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      expect(
        (await api.post(`/store/auctions/${past.id}/join`, {}, { headers: auth })).status
      ).toEqual(201)
    })

    it("charges only once: a second join is 409 and writes no second row (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()

      expect(
        (await api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(409)
      // Medusa's error handler replaces a 409's code and message, so the
      // client keys on the status; GET says `joined: true`.
      expect(refused.data.code).toEqual("invalid_state_error")
      expect(await joinFeeRows(walletId!)).toHaveLength(1)
      expect(await balanceOf(walletId!)).toEqual(50_000)
    })

    it("serialises two concurrent joins: one 201, one 409, one charge (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()

      const results = await Promise.allSettled([
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth }),
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth }),
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
      expect(await participants(auctionId)).toHaveLength(1)
    })

    it("blocks a short balance with nothing written (AC2)", async () => {
      const { auth, walletId } = await customer(40_000)
      const { id: auctionId } = await auction()

      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")
      expect(await participants(auctionId)).toHaveLength(0)
      expect(await joinFeeRows(walletId!)).toHaveLength(0)
      expect(await balanceOf(walletId!)).toEqual(40_000)
    })

    it("treats no wallet as Rp0 (AC2, D-011)", async () => {
      const { auth } = await customer(null)
      const { id: auctionId } = await auction()

      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")
      expect(await participants(auctionId)).toHaveLength(0)
    })

    it("charges the override fee when one is set (D-032)", async () => {
      const { auth, walletId } = await customer(60_000)
      const { id: auctionId } = await auction({
        join_fee: 100_000,
        fee_override_join_fee: 50_000,
      })

      expect(
        (await api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })).status
      ).toEqual(201)
      expect((await joinFeeRows(walletId!)).map((t) => Number(t.amount))).toEqual([-50_000])
      expect(await balanceOf(walletId!)).toEqual(10_000)
    })

    it("refuses the farmer joining their own auction (AC4, D-033)", async () => {
      const { id: customerId, auth } = await customer(150_000)
      const { id: auctionId } = await auction({ payer_customer_id: customerId })

      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      )
      expect(refused.status).toEqual(403)
      expect(refused.data.code).toEqual("own_auction")
      expect(await participants(auctionId)).toHaveLength(0)
    })

    it("refuses draft, pending_approval, closed and cancelled auctions (AC3)", async () => {
      const { auth } = await customer(150_000)
      for (const status of ["draft", "pending_approval", "closed", "cancelled"] as const) {
        const { id: auctionId } = await auction({ status })
        const refused = await failure(
          api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
        )
        expect(refused.status).toEqual(409)
        expect(await participants(auctionId)).toHaveLength(0)
      }
    })

    it("requires a customer token (AC1)", async () => {
      const { id: auctionId } = await auction()
      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, {}, {
          headers: { "x-publishable-api-key": publishable },
        })
      )
      expect(refused.status).toEqual(401)
    })

    it("refuses a body: identity and amount are server-side (AC1)", async () => {
      const { auth, walletId } = await customer(150_000)
      const { id: auctionId } = await auction()

      const refused = await failure(
        api.post(`/store/auctions/${auctionId}/join`, { customer_id: "cus_other" }, { headers: auth })
      )
      expect(refused.status).toEqual(400)
      expect(await participants(auctionId)).toHaveLength(0)
      expect(await joinFeeRows(walletId!)).toHaveLength(0)
    })

    it("GET reports joined and the fee (T-041.2)", async () => {
      const { auth } = await customer(150_000)
      const { id: auctionId } = await auction({ fee_override_join_fee: 75_000 })

      const before = await api.get(`/store/auctions/${auctionId}/join`, { headers: auth })
      expect(before.status).toEqual(200)
      expect(before.data).toEqual({ joined: false, join_fee: 75_000 })

      await api.post(`/store/auctions/${auctionId}/join`, {}, { headers: auth })
      const after = await api.get(`/store/auctions/${auctionId}/join`, { headers: auth })
      expect(after.data).toEqual({ joined: true, join_fee: 75_000 })

      // Unknown auction: 404, so a draft id can't be probed.
      expect(
        (await failure(api.get("/store/auctions/auct_missing/join", { headers: auth }))).status
      ).toEqual(404)
    })
  },
})
