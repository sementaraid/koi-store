import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { PII_AUDIT_MODULE } from "../../src/modules/pii-audit"
import type PiiAuditModuleService from "../../src/modules/pii-audit/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"

jest.setTimeout(120 * 1000)

// US-070 T-070.1a (list/detail, masked) and T-070.1b (logged phone reveal).
// D-002, D-037, D-042, D-045, D-055, D-058.
const PHONE = "+6281234567890"

type HttpError = { response: { status: number; data: { message?: string } } }
const statusOf = (p: Promise<unknown>) =>
  p.then(() => 200).catch((e: HttpError) => e.response.status)
const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} as { message?: string } }),
    (e: HttpError) => e.response
  )

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id: userId, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string
    let unique = 0

    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)

    const auditRows = () =>
      getContainer().resolve<PiiAuditModuleService>(PII_AUDIT_MODULE).listPiiRevealAudits({})

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `accounts-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
    })

    const mark = (label: string) => `${label}${++unique}-${Date.now()}`

    // A customer with a wallet (link + ledger rows given by the caller).
    const customer = async (
      fields: { first_name?: string; last_name?: string; phone?: string | null } = {}
    ) => {
      const container = getContainer()
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `${mark("acc")}@test.dev`,
          first_name: fields.first_name ?? "Budi",
          last_name: fields.last_name ?? "Santoso",
          phone: fields.phone === undefined ? PHONE : fields.phone,
        },
      ])
      const walletService = container.resolve<WalletModuleService>(WALLET_MODULE)
      const [wallet] = await walletService.createWallets([{}])
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CUSTOMER]: { customer_id: customer.id },
        [WALLET_MODULE]: { wallet_id: wallet.id },
      })
      return { customer, wallet, walletService }
    }

    // A farmer: customer + member + seller on one auth identity (D-003), so the
    // seller resolves to the customer by member email.
    const farmer = async () => {
      const container = getContainer()
      const email = `${mark("farm")}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso", phone: PHONE }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun ${mark("k")}`,
            email,
            currency_code: "idr",
          },
        },
      })
      return { seller, customer, email }
    }

    const strike = async (customerId: string) => {
      const [row] = await moderation().createStrikes([
        {
          customer_id: customerId,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar.",
          created_by: adminId,
        },
      ])
      return row
    }

    const list = (query = "", headers = admin) =>
      api.get(`/admin/accounts${query}`, { headers })

type AccountRow = { id: string; created_at: string; phone: string | null }

    const rowOf = (body: { accounts: AccountRow[] }, id: string) =>
      body.accounts.find((row) => row.id === id)

    describe("GET /admin/accounts", () => {
      it("masks the phone, sums the ledger, derives the ban and resolves the farm", async () => {
        const plain = await customer({})
        await plain.walletService.createWalletTransactions([
          { wallet_id: plain.wallet.id, type: "manual_topup", amount: 150_000 },
          { wallet_id: plain.wallet.id, type: "join_fee", amount: -100_000 },
        ])
        const banned = await customer({ first_name: "Siti", last_name: "Rahmawati" })
        await strike(banned.customer.id)
        await strike(banned.customer.id)
        const farm = await farmer()

        const res = await list("?limit=100")
        expect(res.status).toEqual(200)

        const plainRow = rowOf(res.data, plain.customer.id)
        expect(plainRow).toMatchObject({
          id: plain.customer.id,
          first_name: "Budi",
          last_name: "Santoso",
          email: plain.customer.email,
          phone: "+62********890",
          balance: 50_000,
          active_strikes: 0,
          banned: false,
          farm: null,
        })
        expect(new Date(plainRow!.created_at).toISOString()).toEqual(plainRow!.created_at)

        expect(rowOf(res.data, banned.customer.id)).toMatchObject({
          active_strikes: 2,
          banned: true,
        })

        expect(rowOf(res.data, farm.customer.id)).toMatchObject({
          first_name: "Budi",
          farm: {
            id: farm.seller.id,
            name: farm.seller.name,
            status: expect.stringMatching(/^(open|pending_approval|suspended|terminated)$/),
          },
        })

        // D-042/D-045: the full number never leaves on a read.
        expect(JSON.stringify(res.data.accounts)).not.toContain(PHONE)
        const row = JSON.stringify(plainRow)
        for (const forbidden of ["ktp_nik", "account_number", "address", "password", "holder_name"]) {
          expect(row).not.toContain(forbidden)
        }
      })

      it("searches name and email case-insensitively, newest first, paged", async () => {
        const target = await customer({ first_name: "Andi", last_name: "Wijaya" })
        const other = await customer({ first_name: "Budi", last_name: "Santoso" })

        const byLastName = await list("?q=wIJa")
        expect(byLastName.status).toEqual(200)
        expect(rowOf(byLastName.data, target.customer.id)).toBeDefined()
        expect(rowOf(byLastName.data, other.customer.id)).toBeUndefined()

        const byEmail = await list(`?q=${encodeURIComponent(target.customer.email.toUpperCase())}`)
        expect(rowOf(byEmail.data, target.customer.id)).toBeDefined()
        expect(rowOf(byEmail.data, other.customer.id)).toBeUndefined()

        const all = await list()
        expect(all.data.count).toBeGreaterThanOrEqual(2)
        const allRows = all.data.accounts
        for (let i = 1; i < allRows.length; i++) {
          expect(new Date(allRows[i - 1].created_at).getTime()).toBeGreaterThanOrEqual(
            new Date(allRows[i].created_at).getTime()
          )
        }
        expect(rowOf(all.data, other.customer.id)).toBeDefined()

        const page = await list("?limit=1&offset=1")
        expect(page.data.limit).toEqual(1)
        expect(page.data.offset).toEqual(1)
        expect(page.data.accounts).toHaveLength(1)
        expect(page.data.accounts[0].id).toEqual(all.data.accounts[1].id)
      })

      it("refuses a too-long keyword and non-admin tokens", async () => {
        const tooLong = await failure(list(`?q=${"a".repeat(101)}`))
        expect(tooLong.status).toEqual(400)
        expect(JSON.stringify(tooLong.data)).toContain("Kata kunci terlalu panjang.")

        const [customerUser] = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `${mark("tok")}@test.dev` }])
        const { http } = getContainer().resolve(ContainerRegistrationKeys.CONFIG_MODULE)
          .projectConfig
        const token = generateJwtToken(
          {
            actor_id: customerUser.id,
            actor_type: "customer",
            auth_identity_id: "",
            app_metadata: {},
            user_metadata: {},
          },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )
        expect(await statusOf(list("", { authorization: `Bearer ${token}` }))).toEqual(401)
        expect(await statusOf(list("", {}))).toEqual(401)
      })
    })

    describe("GET /admin/accounts/:id", () => {
      it("returns the same row and masks the phone", async () => {
        const { customer: account } = await customer({ first_name: "Siti", last_name: "Rahmawati" })
        await strike(account.id)

        const res = await api.get(`/admin/accounts/${account.id}`, { headers: admin })
        expect(res.status).toEqual(200)
        expect(res.data.account).toMatchObject({
          id: account.id,
          first_name: "Siti",
          last_name: "Rahmawati",
          email: account.email,
          phone: "+62********890",
          balance: 0,
          active_strikes: 1,
          banned: false,
          farm: null,
        })
        expect(JSON.stringify(res.data)).not.toContain(PHONE)
      })

      it("404s an unknown account in Indonesian", async () => {
        const refused = await failure(api.get("/admin/accounts/cus_missing", { headers: admin }))
        expect(refused.status).toEqual(404)
        expect(JSON.stringify(refused.data)).toContain("Akun tidak ditemukan.")
      })
    })

    describe("POST /admin/customers/:id/reveal", () => {
      const reveal = (id: string, body: unknown, headers = admin) =>
        api.post(`/admin/customers/${id}/reveal`, body, { headers })

      it("returns the full phone and logs exactly one row per reveal", async () => {
        const { customer: account } = await customer()

        const res = await reveal(account.id, { field: "phone" })
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({ field: "phone", value: PHONE })
        // Not re-masked by maskPii (the payload is `{ field, value }`).
        expect(res.data.value).not.toContain("*")

        const rows = await auditRows()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          actor_type: "user",
          actor_id: adminId,
          record_type: "customer",
          record_id: account.id,
          field: "phone",
        })

        // Append-only: a second reveal writes a second row.
        await reveal(account.id, { field: "phone" })
        expect(await auditRows()).toHaveLength(2)

        // Nothing stored changed: the list still carries the mask.
        const listed = await list(`?q=${encodeURIComponent(account.email!)}`)
        expect(rowOf(listed.data, account.id)!.phone).toEqual("+62********890")
      })

      it("refuses non-admin tokens, other fields and unknown accounts, logging nothing", async () => {
        const { customer: account } = await customer()
        const [customerUser] = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `${mark("cust")}@test.dev` }])
        const { http } = getContainer().resolve(ContainerRegistrationKeys.CONFIG_MODULE)
          .projectConfig
        const token = generateJwtToken(
          {
            actor_id: customerUser.id,
            actor_type: "customer",
            auth_identity_id: "",
            app_metadata: {},
            user_metadata: {},
          },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )

        expect(
          await statusOf(reveal(account.id, { field: "phone" }, { authorization: `Bearer ${token}` }))
        ).toEqual(401)
        expect(await statusOf(reveal(account.id, { field: "phone" }, {}))).toEqual(401)

        const wrongField = await failure(reveal(account.id, { field: "ktp_nik" }))
        expect(wrongField.status).toEqual(400)
        expect(JSON.stringify(wrongField.data)).toContain(
          "Kolom yang bisa ditampilkan hanya nomor telepon."
        )
        expect((await failure(reveal(account.id, {}))).status).toEqual(400)

        expect((await failure(reveal("cus_missing", { field: "phone" }))).status).toEqual(404)
        expect(await auditRows()).toHaveLength(0)
      })
    })
  },
})
