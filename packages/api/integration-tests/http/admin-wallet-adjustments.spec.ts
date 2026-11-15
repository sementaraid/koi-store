import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"

jest.setTimeout(60 * 1000)

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "user" | "customer"
) => {
  const { http } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig
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

type HttpError = { response: { status: number; data: { message: string } } }

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("admin wallet adjustments (US-013)", () => {
      let adminAuth: Record<string, string>
      let adminId: string
      let customerAuth: Record<string, string>
      let customerId: string
      let walletId: string
      let walletService: WalletModuleService

      const adjust = (body: unknown, id = customerId, h = adminAuth) =>
        api.post(`/admin/customers/${id}/wallet-adjustments`, body, { headers: h })
      const fail = (p: Promise<unknown>) =>
        p.then(
          () => ({ status: 200, message: "" }),
          (e: HttpError) => ({ status: e.response.status, message: e.response.data.message })
        )
      const balance = async () =>
        (await api.get(`/admin/customers/${customerId}/wallet`, { headers: adminAuth }))
          .data.balance

      beforeEach(async () => {
        const container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `adj-admin-${Date.now()}@test.dev` }])
        adminId = user.id
        adminAuth = { authorization: `Bearer ${jwt(container, user.id, "user")}` }

        const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
          { email: `adj-customer-${Date.now()}@test.dev` },
        ])
        customerId = customer.id
        const [key] = await container
          .resolve(Modules.API_KEY)
          .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
        customerAuth = {
          authorization: `Bearer ${jwt(container, customer.id, "customer")}`,
          "x-publishable-api-key": key.token,
        }

        const [wallet] = await walletService.createWallets([{}])
        walletId = wallet.id
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.CUSTOMER]: { customer_id: customer.id },
          [WALLET_MODULE]: { wallet_id: walletId },
        })
        await walletService.createWalletTransactions([
          { wallet_id: walletId, type: "manual_topup", amount: 100_000, reference: "BCA-1", created_by: "user_x" },
        ])
      })

      it("+ and − adjustments change the balance by exactly the amount, with admin and reason (AC1)", async () => {
        const plus = await adjust({ amount: 25_000, reason: "  Transfer dobel dicatat kurang  " })
        expect(plus.status).toEqual(200)
        expect(plus.data).toEqual({
          wallet_transaction: {
            id: expect.any(String),
            type: "adjustment",
            amount: 25_000,
            reference: "Transfer dobel dicatat kurang",
            created_by: adminId,
            created_at: expect.any(String),
          },
          balance: 125_000,
        })

        const minus = await adjust({ amount: -40_000, reason: "Koreksi salah input" })
        expect(minus.data.wallet_transaction).toMatchObject({ amount: -40_000, created_by: adminId })
        expect(minus.data.balance).toEqual(85_000)
        expect(await balance()).toEqual(85_000)

        // The customer sees the same balance.
        const mine = await api.get("/store/wallet", { headers: customerAuth })
        expect(mine.data.balance).toEqual(85_000)
      })

      it("leaves existing transactions unchanged and appends exactly one row (AC2)", async () => {
        const before = await walletService.listWalletTransactions({ wallet_id: walletId })
        await adjust({ amount: -10_000, reason: "Koreksi" })
        const after = await walletService.listWalletTransactions(
          { wallet_id: walletId },
          { order: { created_at: "ASC" } }
        )
        expect(after).toHaveLength(2)
        const kept = after.find((t) => t.id === before[0].id)!
        expect(kept).toMatchObject({
          type: "manual_topup",
          amount: 100_000,
          reference: "BCA-1",
          created_by: "user_x",
        })
        expect(kept.updated_at).toEqual(before[0].updated_at)
      })

      it("400 for blank reason, zero, non-integer or missing amount; nothing written", async () => {
        for (const body of [
          { amount: 1_000, reason: "   " },
          { amount: 1_000 },
          { amount: 0, reason: "x" },
          { amount: 1.5, reason: "x" },
          { amount: "1000", reason: "x" },
          { reason: "x" },
        ]) {
          expect((await fail(adjust(body))).status).toEqual(400)
        }
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(1)
      })

      it("401 for a customer token or none, on both routes", async () => {
        const body = { amount: 1_000, reason: "x" }
        expect((await fail(adjust(body, customerId, customerAuth))).status).toEqual(401)
        expect((await fail(adjust(body, customerId, {}))).status).toEqual(401)
        expect(
          (await fail(api.get(`/admin/customers/${customerId}/wallet`, { headers: customerAuth })))
            .status
        ).toEqual(401)
        expect((await fail(api.get(`/admin/customers/${customerId}/wallet`))).status).toEqual(401)
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(1)
      })

      it("404 for an unknown customer on both routes", async () => {
        expect((await fail(adjust({ amount: 1_000, reason: "x" }, "cus_missing"))).status).toEqual(404)
        expect(
          (await fail(api.get("/admin/customers/cus_missing/wallet", { headers: adminAuth }))).status
        ).toEqual(404)
      })

      it("400 with a clear message for a customer without a wallet, and creates none (D-011)", async () => {
        const [other] = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `adj-nowallet-${Date.now()}@test.dev` }])
        const res = await fail(adjust({ amount: 1_000, reason: "x" }, other.id))
        expect(res.status).toEqual(400)
        expect(res.message).toContain("has no wallet")
        expect(await walletService.listWallets()).toHaveLength(1)

        const view = await api.get(`/admin/customers/${other.id}/wallet`, { headers: adminAuth })
        expect(view.data).toEqual({ balance: 0, transactions: [], count: 0, limit: 20, offset: 0 })
      })

      it("allows a correction to exactly Rp0 (owner: floor Rp0)", async () => {
        const res = await adjust({ amount: -100_000, reason: "Koreksi penuh" })
        expect(res.status).toEqual(200)
        expect(res.data.balance).toEqual(0)
      })

      it("400 for a correction below Rp0, nothing written", async () => {
        const res = await fail(adjust({ amount: -100_001, reason: "Terlalu besar" }))
        expect(res.status).toEqual(400)
        expect(res.message).toEqual(
          "Adjustment would make the balance negative (current 100000, change -100001)"
        )
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(1)
        expect(await balance()).toEqual(100_000)
      })

      it("two concurrent −60.000 corrections on 100.000: exactly one lands, balance 40.000", async () => {
        const results = await Promise.all([
          fail(adjust({ amount: -60_000, reason: "Koreksi A" })),
          fail(adjust({ amount: -60_000, reason: "Koreksi B" })),
        ])
        expect(results.map((r) => r.status).sort()).toEqual([200, 400])
        expect(results.find((r) => r.status === 400)!.message).toContain(
          "Adjustment would make the balance negative"
        )
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(2)
        expect(await balance()).toEqual(40_000)
      })

      it("GET wallet lists newest first with the store route's bounds", async () => {
        await adjust({ amount: 5_000, reason: "Bonus koreksi" })
        const res = await api.get(`/admin/customers/${customerId}/wallet?limit=1`, {
          headers: adminAuth,
        })
        expect(res.data).toMatchObject({ balance: 105_000, count: 2, limit: 1, offset: 0 })
        expect(res.data.transactions).toEqual([
          expect.objectContaining({ type: "adjustment", amount: 5_000, reference: "Bonus koreksi" }),
        ])
        for (const q of ["limit=0", "limit=101", "offset=-1"]) {
          expect(
            (await fail(api.get(`/admin/customers/${customerId}/wallet?${q}`, { headers: adminAuth })))
              .status
          ).toEqual(400)
        }
      })

      it("core GET /admin/customers?q= finds a customer by email (customer search for admin-koi)", async () => {
        const res = await api.get(`/admin/customers?q=adj-customer-`, { headers: adminAuth })
        expect(res.data.customers.map((c: { id: string }) => c.id)).toContain(customerId)
      })
    })
  },
})
