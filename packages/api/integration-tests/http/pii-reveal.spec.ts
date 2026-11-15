import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { PII_AUDIT_MODULE } from "../../src/modules/pii-audit"
import type PiiAuditModuleService from "../../src/modules/pii-audit/service"

jest.setTimeout(120 * 1000)

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(() => 200).catch((e: HttpError) => e.response.status)

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id: userId, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

const NIK = "3273012345678901"
const ACCOUNT = "1234567890"
const SELLER_PHONE = "+6281111222333"
const APPLICANT_PHONE = "+6281234567890"

// US-092 T-092.2 (masking) and T-092.5 (logged reveal), on the farm queue.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string

    // migrationOnly mode skips the Custom Fields loader (see admin-farms.spec.ts).
    beforeAll(async () => {
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      await pg.raw(`
        CREATE TABLE IF NOT EXISTS "seller_custom_fields" (
          "id" varchar(255) not null,
          "seller_id" varchar(255) not null,
          "ktp_photo_key" varchar(255) null,
          "ktp_nik" varchar(255) null,
          "farm_photo_urls" text[] null,
          "created_at" timestamptz not null default CURRENT_TIMESTAMP,
          "updated_at" timestamptz not null default CURRENT_TIMESTAMP,
          "deleted_at" timestamptz null,
          constraint "seller_custom_fields_pkey" primary key ("id")
        )
      `)
    })

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `pii-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
    })

    const registerFarm = async (opts: { holder_name?: string; first_name?: string | null } = {}) => {
      const container = getContainer()
      const email = `pii-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email,
          first_name: opts.first_name === undefined ? "Budi" : opts.first_name,
          last_name: opts.first_name === null ? null : "Santoso",
          phone: APPLICANT_PHONE,
        },
      ])
      await auth.updateAuthIdentities({ id: authIdentity!.id, app_metadata: { customer_id: customer.id } })

      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          address: { address_1: "Jl. Raya Bogor 1", city: "Bogor", province: "Jawa Barat" },
          payment_details: {
            holder_name: opts.holder_name ?? "Budi Santoso",
            bank_name: "BCA",
            account_number: ACCOUNT,
          },
          additional_data: {
            ktp_photo_key: "private-ktp.png",
            ktp_nik: NIK,
            farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
          },
        },
      })

      // CreateSellerDTO has no phone; the registration route copies it (D-016).
      await container
        .resolve(ContainerRegistrationKeys.PG_CONNECTION)
        .raw(`UPDATE seller SET phone = ? WHERE id = ?`, [SELLER_PHONE, seller.id])

      const memberSignIn = await api.post("/auth/member/emailpass", { email, password })
      const customerSignIn = await api.post("/auth/customer/emailpass", { email, password })
      return {
        seller,
        member: { authorization: `Bearer ${memberSignIn.data.token}` },
        vendor: { authorization: `Bearer ${memberSignIn.data.token}`, "x-seller-id": seller.id },
        customer: { authorization: `Bearer ${customerSignIn.data.token}` },
      }
    }

    const auditRows = (recordId: string) =>
      getContainer()
        .resolve<PiiAuditModuleService>(PII_AUDIT_MODULE)
        .listPiiRevealAudits({ record_id: recordId })

    const farmIn = async (sellerId: string) => {
      const list = await api.get("/admin/farms?limit=100", { headers: admin })
      return { list, farm: list.data.farms.find((f: { id: string }) => f.id === sellerId) }
    }

    it("never returns a full PII value from the farm routes (AC3)", async () => {
      const { seller } = await registerFarm()
      const { list, farm } = await farmIn(seller.id)
      const detail = await api.get(`/admin/farms/${seller.id}`, { headers: admin })

      expect(farm).toMatchObject({
        ktp_nik: "3273**********01",
        phone: "+62********333",
        payment_details: { holder_name: "B*** S******", account_number: "******7890" },
        applicant: { phone: "+62********890" },
      })
      for (const body of [JSON.stringify(list.data), JSON.stringify(detail.data)]) {
        for (const full of [NIK, ACCOUNT, SELLER_PHONE, APPLICANT_PHONE, "Budi Santoso"]) {
          expect(body).not.toContain(full)
        }
      }
    })

    it("reveals each full value and logs exactly one audit row per reveal (AC5)", async () => {
      const { seller } = await registerFarm()
      const expected = {
        ktp_nik: NIK,
        account_number: ACCOUNT,
        holder_name: "Budi Santoso",
        phone: SELLER_PHONE,
        applicant_phone: APPLICANT_PHONE,
      }

      for (const [field, value] of Object.entries(expected)) {
        const before = Date.now()
        const res = await api.post(`/admin/farms/${seller.id}/reveal`, { field }, { headers: admin })
        expect(res.data).toEqual({ field, value })

        const rows = (await auditRows(seller.id)).filter((r) => r.field === field)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          actor_type: "user",
          actor_id: adminId,
          record_type: "seller",
          record_id: seller.id,
          field,
        })
        expect(new Date(rows[0].created_at).getTime()).toBeGreaterThanOrEqual(before - 1000)
      }
      expect(await auditRows(seller.id)).toHaveLength(5)

      // The audit is append-only (D-042).
      const service = getContainer().resolve<PiiAuditModuleService>(PII_AUDIT_MODULE)
      const [row] = await auditRows(seller.id)
      expect(() => service.deletePiiRevealAudits([row.id])).toThrow("append-only")
      expect(() => service.updatePiiRevealAudits({ id: row.id, field: "x" })).toThrow("append-only")
    })

    it("refuses non-admin tokens, bad fields and unknown farms, and logs nothing (AC5)", async () => {
      const { seller, member, vendor, customer } = await registerFarm()
      const reveal = (headers: Record<string, string>, body: unknown, id = seller.id) =>
        statusOf(api.post(`/admin/farms/${id}/reveal`, body, { headers }))

      for (const headers of [customer, member, vendor, {}]) {
        expect(await reveal(headers, { field: "ktp_nik" })).toEqual(401)
      }
      expect(await reveal(admin, { field: "email" })).toEqual(400)
      expect(await reveal(admin, {})).toEqual(400)
      expect(await reveal(admin, { field: "ktp_nik" }, "sel_missing")).toEqual(404)

      expect(await auditRows(seller.id)).toHaveLength(0)
      expect(await auditRows("sel_missing")).toHaveLength(0)
    })

    it("compares the full holder name with the applicant on the server (US-021 AC1)", async () => {
      const match = await registerFarm({ holder_name: "  budi   SANTOSO " })
      const mismatch = await registerFarm({ holder_name: "Andi Wijaya" })
      // Registration requires a holder name; blank it directly to cover a row
      // that has none.
      const noHolder = await registerFarm()
      await getContainer()
        .resolve(ContainerRegistrationKeys.PG_CONNECTION)
        .raw(`UPDATE payment_details SET holder_name = NULL WHERE seller_id = ?`, [noHolder.seller.id])
      const noName = await registerFarm({ first_name: null })

      expect((await farmIn(match.seller.id)).farm.holder_matches_applicant).toBe(true)
      expect((await farmIn(mismatch.seller.id)).farm.holder_matches_applicant).toBe(false)
      expect((await farmIn(noHolder.seller.id)).farm.holder_matches_applicant).toBeNull()
      expect((await farmIn(noName.seller.id)).farm.holder_matches_applicant).toBeNull()
    })
  },
})
