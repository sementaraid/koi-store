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

type HttpError = { response: { status: number } }

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("admin top-up decisions (US-012)", () => {
      let adminAuth: { authorization: string }
      let adminId: string
      let customerAuth: Record<string, string>
      let customerId: string
      let walletId: string
      let walletService: WalletModuleService
      let requestId: string

      const approve = (id: string, body: unknown, h: Record<string, string> = adminAuth) =>
        api.post(`/admin/topup-requests/${id}/approve`, body, { headers: h })
      const reject = (id: string, body: unknown, h: Record<string, string> = adminAuth) =>
        api.post(`/admin/topup-requests/${id}/reject`, body, { headers: h })
      const statusOf = (p: Promise<unknown>) =>
        p.then(() => 200).catch((e: HttpError) => e.response.status)

      beforeEach(async () => {
        const container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `topup-admin-${Date.now()}@test.dev` }])
        adminId = user.id
        adminAuth = { authorization: `Bearer ${jwt(container, user.id, "user")}` }

        const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
          {
            email: `topup-customer-${Date.now()}@test.dev`,
            first_name: "Budi",
            last_name: "Santoso",
            phone: "+6281234567890",
          },
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

        const [request] = await walletService.createTopupRequests([
          {
            wallet_id: walletId,
            amount: 250_000,
            screenshot_file_key: "private-bukti.png",
          },
        ])
        requestId = request.id
      })

      const balance = async () =>
        (await api.get("/store/wallet", { headers: customerAuth })).data.balance

      it("401 for no token and for a customer token on all three routes", async () => {
        // A customer token must not open the admin routes.
        expect(
          await statusOf(api.get("/admin/topup-requests", { headers: customerAuth }))
        ).toEqual(401)
        expect(
          await statusOf(approve(requestId, { bank_reference: "BCA-1" }, customerAuth))
        ).toEqual(401)
        expect(await statusOf(reject(requestId, { reason: "no" }, customerAuth))).toEqual(401)

        // No token at all.
        expect(await statusOf(api.get("/admin/topup-requests"))).toEqual(401)
        expect(await statusOf(approve(requestId, { bank_reference: "BCA-1" }, {}))).toEqual(401)
        expect(await statusOf(reject(requestId, { reason: "no" }, {}))).toEqual(401)

        // A publishable key alone is not an admin identity either.
        const key = { "x-publishable-api-key": customerAuth["x-publishable-api-key"] }
        expect(await statusOf(api.get("/admin/topup-requests", { headers: key }))).toEqual(401)
        expect(
          await statusOf(
            api.post(`/admin/topup-requests/${requestId}/approve`, { bank_reference: "x" }, { headers: key })
          )
        ).toEqual(401)
        expect(
          await statusOf(
            api.post(`/admin/topup-requests/${requestId}/reject`, { reason: "x" }, { headers: key })
          )
        ).toEqual(401)

        // Nothing was decided by any refused call.
        const [row] = await walletService.listTopupRequests({ id: requestId })
        expect(row.status).toEqual("pending")
      })

      it("lists newest first, includes the customer, never a screenshot URL", async () => {
        const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
        for (const [id, status, ago] of [
          ["topup_old", "rejected", "2 hours"],
          ["topup_mid", "approved", "1 hour"],
        ] as const) {
          await pg.raw(
            `INSERT INTO topup_request (id, amount, raw_amount, status, screenshot_file_key, wallet_id, created_at)
             VALUES (?, 1000, '{"value":"1000","precision":20}', ?, 'private-x.png', ?, now() - interval '${ago}')`,
            [id, status, walletId]
          )
        }

        const response = await api.get("/admin/topup-requests?limit=2", {
          headers: adminAuth,
        })
        expect(response.status).toEqual(200)
        expect(response.data.count).toEqual(3)
        expect(response.data.topup_requests.map((r: { id: string }) => r.id)).toEqual([
          requestId,
          "topup_mid",
        ])
        expect(response.data.topup_requests[0]).toEqual({
          id: requestId,
          amount: 250_000,
          status: "pending",
          reason: null,
          reviewed_by: null,
          customer: {
            id: customerId,
            email: expect.stringContaining("topup-customer-"),
            first_name: "Budi",
            last_name: "Santoso",
          },          created_at: expect.any(String),
          has_screenshot: true,
        })
        expect(JSON.stringify(response.data)).not.toContain("private-bukti.png")

        const rejected = await api.get("/admin/topup-requests?status=rejected", {
          headers: adminAuth,
        })
        expect(rejected.data.topup_requests.map((r: { id: string }) => r.id)).toEqual([
          "topup_old",
        ])
      })

      it("bounds status, limit 1..100 and offset >= 0", async () => {
        const get = (q: string) =>
          statusOf(api.get(`/admin/topup-requests?${q}`, { headers: adminAuth }))
        expect(await get("limit=1")).toEqual(200)
        expect(await get("limit=100")).toEqual(200)
        expect(await get("status=pending")).toEqual(200)
        expect(await get("status=approved")).toEqual(200)
        expect(await get("status=rejected")).toEqual(200)
        expect(await get("limit=0")).toEqual(400)
        expect(await get("limit=101")).toEqual(400)
        expect(await get("offset=-1")).toEqual(400)
        expect(await get("status=done")).toEqual(400)
      })

      it("approve credits the balance once, with the admin and bank reference (AC1)", async () => {
        expect(await balance()).toEqual(0)

        const response = await approve(requestId, { bank_reference: "BCA-2026-11-14-001" })
        expect(response.status).toEqual(200)
        expect(response.data.request).toMatchObject({
          id: requestId,
          status: "approved",
          reviewed_by: adminId,
          reason: null,
          amount: 250_000,
        })
        expect(response.data.wallet_transaction).toMatchObject({
          type: "manual_topup",
          amount: 250_000,
          reference: "BCA-2026-11-14-001",
          created_by: adminId,
        })

        // Exactly one ledger row, positive, tied to this request's wallet.
        const transactions = await walletService.listWalletTransactions({
          wallet_id: walletId,
        })
        expect(transactions).toHaveLength(1)
        expect(transactions[0]).toMatchObject({
          type: "manual_topup",
          amount: 250_000,
          reference: "BCA-2026-11-14-001",
          created_by: adminId,
        })
        // Balance is the sum of the ledger, not a stored number.
        expect(await balance()).toEqual(250_000)

        const [row] = await walletService.listTopupRequests({ id: requestId })
        expect(row.decided_at).toBeInstanceOf(Date)
      })

      it("reject stores the reason and records no transaction (AC2)", async () => {
        const response = await reject(requestId, {
          reason: "Transfer tidak ditemukan di mutasi bank",
        })
        expect(response.status).toEqual(200)
        expect(response.data.request).toMatchObject({
          id: requestId,
          status: "rejected",
          reason: "Transfer tidak ditemukan di mutasi bank",
          reviewed_by: adminId,
        })
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(0)
        expect(await balance()).toEqual(0)

        // The customer sees the reason through the store route (US-011 AC4).
        const mine = await api.get("/store/topup-requests", { headers: customerAuth })
        expect(mine.data.requests[0]).toMatchObject({
          status: "rejected",
          reason: "Transfer tidak ditemukan di mutasi bank",
        })
      })

      it("refuses a second decision with 409 and writes nothing more (AC3)", async () => {
        expect((await approve(requestId, { bank_reference: "BCA-1" })).status).toEqual(200)

        expect(await statusOf(approve(requestId, { bank_reference: "BCA-2" }))).toEqual(409)
        expect(await statusOf(reject(requestId, { reason: "batal" }))).toEqual(409)

        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(1)
        const [row] = await walletService.listTopupRequests({ id: requestId })
        expect(row.status).toEqual("approved")
        expect(row.reason).toBeNull()

        const pending = await walletService.createTopupRequests([
          { wallet_id: walletId, amount: 1, screenshot_file_key: "private-y.png" },
        ])
        expect(await statusOf(reject(pending[0].id, { reason: "salah" }))).toEqual(200)
        expect(await statusOf(approve(pending[0].id, { bank_reference: "BCA-3" }))).toEqual(409)
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(1)
      })

      it("404s for an unknown request on approve and reject", async () => {
        expect(await statusOf(approve("topup_nope", { bank_reference: "BCA-1" }))).toEqual(404)
        expect(await statusOf(reject("topup_nope", { reason: "x" }))).toEqual(404)
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(0)
      })

      it("rejects a missing or blank bank_reference and reason", async () => {
        for (const body of [{}, { bank_reference: "" }, { bank_reference: "   " }]) {
          expect(await statusOf(approve(requestId, body))).toEqual(400)
        }
        for (const body of [{}, { reason: "" }, { reason: "   " }]) {
          expect(await statusOf(reject(requestId, body))).toEqual(400)
        }
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(0)
        const [row] = await walletService.listTopupRequests({ id: requestId })
        expect(row.status).toEqual("pending")
      })

      it("concurrent double-approve produces exactly one transaction", async () => {
        const results = await Promise.allSettled([
          approve(requestId, { bank_reference: "BCA-A" }),
          approve(requestId, { bank_reference: "BCA-B" }),
        ])

        const ok = results.filter((r) => r.status === "fulfilled")
        const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[]
        expect(ok).toHaveLength(1)
        expect(failed).toHaveLength(1)
        expect(failed[0].reason.response.status).toEqual(409)

        const transactions = await walletService.listWalletTransactions({
          wallet_id: walletId,
        })
        expect(transactions).toHaveLength(1)
        expect(await balance()).toEqual(250_000)
      })
    })
  },
})
