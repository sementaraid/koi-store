import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"

jest.setTimeout(60 * 1000)

const jwtFor = (container: MedusaContainer, customerId: string) => {
  const { http } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig
  return generateJwtToken(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

const publishableKey = async (container: MedusaContainer) => {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const [key] = await apiKeyModule.createApiKeys([
    { title: "test", type: "publishable", created_by: "test" },
  ])
  return key.token
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("GET /store/wallet", () => {
      let customerId: string
      let token: string
      let key: string
      let walletId: string
      let walletService: WalletModuleService

      beforeEach(async () => {
        const container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

        const customerModule = container.resolve(Modules.CUSTOMER)
        const [customer] = await customerModule.createCustomers([
          { email: `wallet-${Date.now()}@test.dev` },
        ])
        customerId = customer.id
        token = jwtFor(container, customerId)
        key = await publishableKey(container)

        const [wallet] = await walletService.createWallets([{}])
        walletId = wallet.id
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.CUSTOMER]: { customer_id: customerId },
          [WALLET_MODULE]: { wallet_id: walletId },
        })
      })

      it("returns an empty wallet with balance 0", async () => {
        const response = await api.get("/store/wallet", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(response.data).toEqual({
          balance: 0,
          transactions: [],
          count: 0,
          limit: 20,
          offset: 0,
        })
      })

      it("returns balance equal to the sum of transactions, newest first", async () => {
        await walletService.createWalletTransactions([
          { wallet_id: walletId, type: "manual_topup", amount: 150_000, reference: "BR-1" },
          { wallet_id: walletId, type: "join_fee", amount: -100_000, reference: "auc_1" },
          { wallet_id: walletId, type: "adjustment", amount: -25_000, reference: "correction" },
        ])

        const response = await api.get("/store/wallet?limit=2", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(response.data.balance).toEqual(25_000)
        expect(response.data.count).toEqual(3)
        expect(response.data.limit).toEqual(2)
        expect(response.data.transactions).toHaveLength(2)
        expect(response.data.transactions.map((t: { amount: number }) => t.amount)).toEqual([
          -25_000,
          -100_000,
        ])
      })

      it("returns an empty wallet when the customer has none (and creates nothing)", async () => {
        const container = getContainer()
        const [other] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `no-wallet-${Date.now()}@test.dev` }])

        const response = await api.get("/store/wallet", {
          headers: {
            authorization: `Bearer ${jwtFor(container, other.id)}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(response.data.balance).toEqual(0)
        expect(response.data.count).toEqual(0)

        const wallets = await walletService.listWallets()
        expect(wallets).toHaveLength(1)
      })

      it("sums every transaction, past the default page size", async () => {
        const rows = Array.from({ length: 30 }, (_, i) => ({
          wallet_id: walletId,
          type: "manual_topup" as const,
          amount: 1_000,
          reference: `row-${i}`,
        }))
        await walletService.createWalletTransactions(rows)

        const response = await api.get("/store/wallet", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(response.data.count).toEqual(30)
        expect(response.data.balance).toEqual(30_000)
      })

      it("returns amounts at and above 5e9 as JSON numbers", async () => {
        await walletService.createWalletTransactions([
          { wallet_id: walletId, type: "manual_topup", amount: 5_000_000_000 },
        ])

        const response = await api.get("/store/wallet", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(typeof response.data.balance).toEqual("number")
        expect(response.data.balance).toEqual(5_000_000_000)
        expect(typeof response.data.transactions[0].amount).toEqual("number")
        expect(response.data.transactions[0].amount).toEqual(5_000_000_000)
      })

      it("rejects a negative limit or offset instead of 500ing", async () => {
        const auth = {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        }

        for (const query of ["limit=-1", "offset=-3"]) {
          const error = await api
            .get(`/store/wallet?${query}`, auth)
            .catch((e: { response: { status: number } }) => e)
          expect({ query, status: error.response.status }).toEqual({
            query,
            status: 400,
          })
        }
      })

      it("bounds limit 1..100 and offset >= 0", async () => {
        const auth = {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        }
        const statusOf = (query: string) =>
          api
            .get(`/store/wallet?${query}`, auth)
            .then(() => 200)
            .catch((e: { response: { status: number } }) => e.response.status)

        // Accepted.
        expect(await statusOf("")).toEqual(200) // defaults 20/0
        expect(await statusOf("limit=1")).toEqual(200)
        expect(await statusOf("limit=100")).toEqual(200)
        expect(await statusOf("offset=0")).toEqual(200)

        // Rejected.
        expect(await statusOf("limit=0")).toEqual(400)
        expect(await statusOf("limit=101")).toEqual(400)
        expect(await statusOf("limit=abc")).toEqual(400)
        expect(await statusOf("offset=-1")).toEqual(400)
      })

      it("ignores a client-supplied order and always returns newest first", async () => {
        const container = getContainer()
        // Distinct created_at so the order is observable.
        const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        for (const [id, offset] of [
          ["wtx_old", "1 hour"],
          ["wtx_new", "0"],
        ] as const) {
          await pg.raw(
            `INSERT INTO wallet_transaction (id, type, amount, raw_amount, reference, wallet_id, created_at)
             VALUES (?, 'manual_topup', 1000, '{"value":"1000","precision":20}', ?, ?, now() - interval '${offset}')`,
            [id, id, walletId]
          )
        }

        const response = await api.get("/store/wallet?order=created_at", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        expect(
          response.data.transactions.map((t: { reference: string }) => t.reference)
        ).toEqual(["wtx_new", "wtx_old"])
      })

      it("resolves the auction id in reference to a lot title, and never leaks the id", async () => {
        const container = getContainer()
        const auctions =
          container.resolve<AuctionModuleService>(AUCTION_MODULE)
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([
          { title: "Kohaku 48 cm", status: "draft" as never },
        ])
        const [auction] = await auctions.createAuctions([
          {
            seller_id: "sel_wallet",
            fee_category_id: "feecat_wallet",
            start_at: new Date(Date.now() - 60_000),
            end_at: new Date(Date.now() + 86_400_000),
            delivery_method: "courier",
            listing_fee: 50_000,
            join_fee: 100_000,
            extend_window_minutes: 5,
            status: "live",
          },
        ])
        await auctions.createLots([
          {
            auction_id: auction.id,
            product_id: product.id,
            ob: 1_000_000,
            kb: 100_000,
            current_price: 1_000_000,
            end_time: new Date(Date.now() + 86_400_000),
          },
        ])

        await walletService.createWalletTransactions([
          { wallet_id: walletId, type: "join_fee", amount: -100_000, reference: auction.id },
          { wallet_id: walletId, type: "refund", amount: 100_000, reference: auction.id },
          { wallet_id: walletId, type: "manual_topup", amount: 150_000, reference: "BCA-123" },
          { wallet_id: walletId, type: "adjustment", amount: -25_000, reference: "Koreksi admin" },
          { wallet_id: walletId, type: "listing_fee", amount: -50_000, reference: "auct_missing" },
        ])

        const response = await api.get("/store/wallet", {
          headers: {
            authorization: `Bearer ${token}`,
            "x-publishable-api-key": key,
          },
        })

        expect(response.status).toEqual(200)
        const rows = response.data.transactions as {
          type: string
          reference: string | null
          description: string | null
        }[]
        const byType = Object.fromEntries(rows.map((t) => [t.type, t]))

        // The stored reference is still the auction id.
        expect(byType.join_fee.reference).toEqual(auction.id)
        // The history gets the lot title instead of the id.
        expect(byType.join_fee.description).toEqual("Kohaku 48 cm")
        expect(byType.refund.description).toEqual("Kohaku 48 cm")
        // Already-text references are shown as they are.
        expect(byType.manual_topup.description).toEqual("BCA-123")
        expect(byType.adjustment.description).toEqual("Koreksi admin")
        // An unresolved auction id is dropped, never shown raw.
        expect(byType.listing_fee.description).toBeNull()
      })

      it("rejects a request without a customer token", async () => {
        const error = await api
          .get("/store/wallet", { headers: { "x-publishable-api-key": key } })
          .catch((e: { response: { status: number } }) => e)

        expect(error.response.status).toEqual(401)
      })
    })
  },
})
