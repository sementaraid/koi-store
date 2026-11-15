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

const customerJwt = (container: MedusaContainer, customerId: string) => {
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

// 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

const form = (fields: {
  amount?: string
  file?: { data: Buffer; type: string; name: string }
}) => {
  const body = new FormData()
  if (fields.amount !== undefined) {
    body.append("amount", fields.amount)
  }
  if (fields.file) {
    body.append(
      "screenshot",
      new Blob([new Uint8Array(fields.file.data)], { type: fields.file.type }),
      fields.file.name
    )
  }
  return body
}

const png = { data: PNG, type: "image/png", name: "bukti.png" }

type HttpError = { response: { status: number } }

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("customer top-up requests (US-011)", () => {
      let headers: Record<string, string>
      let walletId: string
      let walletService: WalletModuleService

      beforeEach(async () => {
        const container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)
        const [customer] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `topup-${Date.now()}@test.dev` }])
        const [key] = await container
          .resolve(Modules.API_KEY)
          .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
        headers = {
          authorization: `Bearer ${customerJwt(container, customer.id)}`,
          "x-publishable-api-key": key.token,
        }
        const [wallet] = await walletService.createWallets([{}])
        walletId = wallet.id
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.CUSTOMER]: { customer_id: customer.id },
          [WALLET_MODULE]: { wallet_id: walletId },
        })
      })

      const post = (body: FormData, h = headers) =>
        api.post("/store/topup-requests", body, { headers: h })
      const statusOf = (p: Promise<unknown>) =>
        p.then(() => 200).catch((e: HttpError) => e.response.status)

      it("401 without a customer token on every route", async () => {
        const { "x-publishable-api-key": key } = headers
        const noAuth = { "x-publishable-api-key": key }
        expect(await statusOf(api.get("/store/topup-requests", { headers: noAuth }))).toEqual(401)
        expect(await statusOf(post(form({ amount: "1000", file: png }), noAuth))).toEqual(401)
        expect(
          await statusOf(api.get("/store/platform-bank-account", { headers: noAuth }))
        ).toEqual(401)
      })

      it("creates a pending request and leaves the balance unchanged (AC1, AC2)", async () => {
        const before = await api.get("/store/wallet", { headers })
        expect(before.data.balance).toEqual(0)

        // Any amount, no minimum (AC1): 1 rupiah is accepted.
        const response = await post(form({ amount: "1", file: png }))
        expect(response.status).toEqual(200)
        expect(response.data.request).toEqual({
          id: expect.stringMatching(/^topup_/),
          amount: 1,
          status: "pending",
          reason: null,
          // No URL or file key leaks to the customer (US-011 fix).
          has_screenshot: true,
          created_at: expect.any(String),
        })
        expect(JSON.stringify(response.data)).not.toContain("bukti-transfer")

        const after = await api.get("/store/wallet", { headers })
        expect(after.data.balance).toEqual(0)
        expect(after.data.count).toEqual(0)
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(0)
      })

      it("accepts amounts past the 32-bit integer cap (D-012 column)", async () => {
        const response = await post(form({ amount: "5000000000", file: png }))
        expect(response.data.request.amount).toEqual(5_000_000_000)
      })

      it("rejects a missing, zero, negative, fractional or non-numeric amount", async () => {
        for (const amount of [undefined, "0", "-5", "1.5", "abc", "", "1e3"]) {
          const status = await statusOf(post(form({ amount, file: png })))
          expect({ amount, status }).toEqual({ amount, status: 400 })
        }
      })

      it("rejects a missing, non-image or oversized file", async () => {
        expect(await statusOf(post(form({ amount: "1000" })))).toEqual(400)
        expect(
          await statusOf(
            post(
              form({
                amount: "1000",
                file: { data: Buffer.from("hello"), type: "text/plain", name: "a.txt" },
              })
            )
          )
        ).toEqual(400)
        expect(
          await statusOf(
            post(
              form({
                amount: "1000",
                file: { data: Buffer.alloc(5 * 1024 * 1024 + 1), type: "image/png", name: "big.png" },
              })
            )
          )
        ).toEqual(400)

        // Nothing was stored for any refused request.
        expect(await walletService.listTopupRequests({ wallet_id: walletId })).toHaveLength(0)
      })

      it("refuses a customer without a wallet and stores nothing", async () => {
        const container = getContainer()
        const [other] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `topup-nowallet-${Date.now()}@test.dev` }])
        const status = await statusOf(
          post(form({ amount: "1000", file: png }), {
            ...headers,
            authorization: `Bearer ${customerJwt(container, other.id)}`,
          })
        )
        expect(status).toEqual(400)
        expect(await walletService.listTopupRequests()).toHaveLength(0)
      })

      it("lists only my requests, newest first, with status and reason (AC4)", async () => {
        const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
        for (const [id, status, reason, ago] of [
          ["topup_old", "rejected", "Transfer tidak ditemukan", "2 hours"],
          ["topup_mid", "approved", null, "1 hour"],
          ["topup_new", "pending", null, "0"],
        ] as const) {
          await pg.raw(
            `INSERT INTO topup_request (id, amount, raw_amount, status, reason, screenshot_file_key, wallet_id, created_at)
             VALUES (?, 1000, '{"value":"1000","precision":20}', ?, ?, 'private-x.png', ?, now() - interval '${ago}')`,
            [id, status, reason, walletId]
          )
        }
        // Someone else's request must not show up.
        const [otherWallet] = await walletService.createWallets([{}])
        await walletService.createTopupRequests([
          { wallet_id: otherWallet.id, amount: 7, screenshot_file_key: "private-o.png" },
        ])

        const response = await api.get("/store/topup-requests?limit=2", { headers })
        expect(response.status).toEqual(200)
        expect(response.data.count).toEqual(3)
        expect(response.data.limit).toEqual(2)
        expect(response.data.offset).toEqual(0)
        expect(response.data.requests.map((r: { id: string }) => r.id)).toEqual([
          "topup_new",
          "topup_mid",
        ])

        const page2 = await api.get("/store/topup-requests?limit=2&offset=2", { headers })
        expect(page2.data.requests).toEqual([
          {
            id: "topup_old",
            amount: 1000,
            status: "rejected",
            reason: "Transfer tidak ditemukan",
            has_screenshot: true,
            created_at: expect.any(String),
          },
        ])
      })

      it("bounds limit 1..100 and offset >= 0", async () => {
        const get = (q: string) => statusOf(api.get(`/store/topup-requests?${q}`, { headers }))
        expect(await get("limit=1")).toEqual(200)
        expect(await get("limit=100")).toEqual(200)
        expect(await get("limit=0")).toEqual(400)
        expect(await get("limit=101")).toEqual(400)
        expect(await get("offset=-1")).toEqual(400)
      })

      it("shows only the platform bank account from settings (AC3)", async () => {
        const empty = await api.get("/store/platform-bank-account", { headers })
        expect(empty.data).toEqual({ bank_name: "", bank_account_number: "", bank_account_holder: "" })

        const container = getContainer()
        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `bank-admin-${Date.now()}@test.dev` }])
        const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
        const adminToken = generateJwtToken(
          { actor_id: user.id, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )
        await api.post(
          "/admin/settings",
          {
            bank_name: "BCA",
            bank_account_number: "1234567890",
            bank_account_holder: "PT Koi Store",
            claim_window_hours: 6,
          },
          { headers: { authorization: `Bearer ${adminToken}` } }
        )

        const response = await api.get("/store/platform-bank-account", { headers })
        expect(response.data).toEqual({
          bank_name: "BCA",
          bank_account_number: "1234567890",
          bank_account_holder: "PT Koi Store",
        })
      })
    })

    describe("screenshot privacy (US-011 fix)", () => {
      const adminJwt = (container: MedusaContainer, userId: string) => {
        const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
        return generateJwtToken(
          { actor_id: userId, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )
      }

      let customerAuth: Record<string, string>
      let adminAuth: { authorization: string }
      let requestId: string
      let fileKey: string

      beforeEach(async () => {
        const container = getContainer()
        const [customer] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `priv-${Date.now()}@test.dev` }])
        const [key] = await container
          .resolve(Modules.API_KEY)
          .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
        customerAuth = {
          authorization: `Bearer ${customerJwt(container, customer.id)}`,
          "x-publishable-api-key": key.token,
        }
        const [wallet] = await container.resolve<WalletModuleService>(WALLET_MODULE).createWallets([{}])
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.CUSTOMER]: { customer_id: customer.id },
          [WALLET_MODULE]: { wallet_id: wallet.id },
        })
        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `priv-admin-${Date.now()}@test.dev` }])
        adminAuth = { authorization: `Bearer ${adminJwt(container, user.id)}` }

        const created = await api.post(
          "/store/topup-requests",
          form({ amount: "1000", file: png }),
          { headers: customerAuth }
        )
        requestId = created.data.request.id

        const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        const {
          rows: [{ screenshot_file_key: keyFromDb }],
        } = await pg.raw(`SELECT screenshot_file_key FROM topup_request WHERE id = ?`, [requestId])
        fileKey = keyFromDb
      })

      it("stores no URL for customers and the key is not publicly served", async () => {
        const list = await api.get("/store/topup-requests", { headers: customerAuth })
        expect(list.data.requests[0]).not.toHaveProperty("screenshot_url")
        expect(JSON.stringify(list.data)).not.toContain(fileKey)

        expect(fileKey).toMatch(/^private-/)
        // The local provider's private dir is outside the only served directory.
        const leaked = await api
          .get(`/static/${fileKey}`)
          .then((r: { status: number }) => r.status)
          .catch((e: HttpError) => e.response.status)
        expect(leaked).not.toEqual(200)
      })

      it("serves the image only to an admin token", async () => {
        const noToken = await api
          .get(`/admin/topup-requests/${requestId}/screenshot`)
          .then((r: { status: number }) => r.status)
          .catch((e: HttpError) => e.response.status)
        expect(noToken).toEqual(401)

        const asCustomer = await api
          .get(`/admin/topup-requests/${requestId}/screenshot`, {
            headers: customerAuth,
            responseType: "arraybuffer",
          })
          .then((r: { status: number }) => r.status)
          .catch((e: HttpError) => e.response.status)
        expect(asCustomer).toEqual(401)

        const asAdmin = await api.get(`/admin/topup-requests/${requestId}/screenshot`, {
          headers: adminAuth,
          responseType: "arraybuffer",
        })
        expect(asAdmin.status).toEqual(200)
        expect(asAdmin.headers["content-type"]).toEqual("image/png")
        expect(asAdmin.headers["cache-control"]).toEqual("private, no-store")
        expect(Buffer.from(asAdmin.data).equals(PNG)).toBe(true)
      })

      it("404s for an unknown request", async () => {
        const missing = await api
          .get(`/admin/topup-requests/topup_nope/screenshot`, { headers: adminAuth })
          .then((r: { status: number }) => r.status)
          .catch((e: HttpError) => e.response.status)
        expect(missing).toEqual(404)
      })
    })
  },
})
