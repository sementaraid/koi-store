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

// qa verification for US-013 (admin adjusts a balance): concurrency and the
// the negative-balance floor (owner decision: never below Rp0).
const jwt = (container: MedusaContainer, actor_id: string) => {
  const { http } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type: "user",
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
    describe("qa: wallet adjustments — concurrency and negative balance (US-013)", () => {
      let adminAuth: Record<string, string>
      let customerId: string
      let walletId: string
      let walletService: WalletModuleService

      beforeEach(async () => {
        const container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `qa-adj-admin-${Date.now()}@test.dev` }])
        adminAuth = { authorization: `Bearer ${jwt(container, user.id)}` }

        const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
          { email: `qa-adj-customer-${Date.now()}@test.dev` },
        ])
        customerId = customer.id

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

      it("two concurrent adjustments both land and the balance equals the sum (no lost update)", async () => {
        const [a, b] = await Promise.all([
          api.post(
            `/admin/customers/${customerId}/wallet-adjustments`,
            { amount: 10_000, reason: "Koreksi A" },
            { headers: adminAuth }
          ),
          api.post(
            `/admin/customers/${customerId}/wallet-adjustments`,
            { amount: -5_000, reason: "Koreksi B" },
            { headers: adminAuth }
          ),
        ])
        expect(a.status).toEqual(200)
        expect(b.status).toEqual(200)

        const rows = await walletService.listWalletTransactions({ wallet_id: walletId })
        expect(rows).toHaveLength(3) // seed + both adjustments, no lost update
        expect(rows.reduce((sum, t) => sum + Number(t.amount), 0)).toEqual(105_000)

        const view = await api.get(`/admin/customers/${customerId}/wallet`, { headers: adminAuth })
        expect(view.data.balance).toEqual(105_000)
      })

      it("an adjustment that would take the balance negative is refused (owner: floor Rp0)", async () => {
        const status = await api
          .post(
            `/admin/customers/${customerId}/wallet-adjustments`,
            { amount: -150_000, reason: "Koreksi besar" },
            { headers: adminAuth }
          )
          .then(() => 200, (e: { response: { status: number } }) => e.response.status)
        expect(status).toEqual(400)

        const view = await api.get(`/admin/customers/${customerId}/wallet`, { headers: adminAuth })
        expect(view.data.balance).toEqual(100_000)
      })

      it("releases the lock on the refused path: the next correction doesn't wait for acquireLockStep's 10s timeout", async () => {
        const refused = await api
          .post(
            `/admin/customers/${customerId}/wallet-adjustments`,
            { amount: -150_000, reason: "Koreksi besar" },
            { headers: adminAuth }
          )
          .then(() => 200, (e: { response: { status: number } }) => e.response.status)
        expect(refused).toEqual(400)

        const start = Date.now()
        const res = await api.post(
          `/admin/customers/${customerId}/wallet-adjustments`,
          { amount: -1_000, reason: "Koreksi kecil" },
          { headers: adminAuth }
        )
        const elapsed = Date.now() - start
        expect(res.status).toEqual(200)
        expect(res.data.balance).toEqual(99_000)
        // acquireLockStep's own retry timeout is 10s; a released lock should
        // let this through almost immediately, not after waiting it out.
        expect(elapsed).toBeLessThan(5_000)
      })
    })
  },
})
