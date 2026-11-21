import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(120 * 1000)

// US-021 AC3 edge (T-021.6): a rejected member resubmits with the member token
// minted *before* the first registration (empty actor_id, the token the
// storefront uses for POST /vendor/sellers). The workflow's guard resolves the
// member by the token's own email so AC3's finality holds for that token too:
// 400 with the Indonesian message, and no second farm written.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>

    beforeAll(async () => {
      // migrationOnly mode skips the Custom Fields loader (see admin-farms.spec.ts).
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
        .createUsers([{ email: `qa-stale-admin-${Date.now()}@test.dev` }])
      const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
      admin = {
        authorization: `Bearer ${generateJwtToken(
          { actor_id: user.id, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )}`,
      }
    })

    const farmBody = (sellerEmail: string, memberEmail: string) => ({
      name: `Kebun ${Date.now()}`,
      email: sellerEmail,
      currency_code: "idr",
      member_email: memberEmail,
      address: { address_1: "Jl. Raya 1", city: "Bogor", province: "Jawa Barat" },
      payment_details: { holder_name: "Budi Santoso", bank_name: "BCA", account_number: "1234567890" },
      additional_data: {
        ktp_photo_key: "private-ktp.png",
        ktp_nik: "3273012345678901",
        farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
      },
    })

    it("writes no second farm for a rejected member, even with the pre-registration token", async () => {
      const container = getContainer()
      const email = `stale-${Date.now()}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email, first_name: "Budi", last_name: "Santoso", phone: "+6281234567890" },
      ])
      await auth.updateAuthIdentities({ id: authIdentity!.id, app_metadata: { customer_id: customer.id } })

      // T0: the token the storefront takes before POST /vendor/sellers; it has
      // no actor_id, so the workflow's rejection guard is skipped.
      const stale = (await api.post("/auth/member/emailpass", { email, password })).data
        .token as string
      const first = await api.post("/vendor/sellers", farmBody(email, email), {
        headers: { authorization: `Bearer ${stale}` },
      })
      expect(first.status).toEqual(201)

      await api.post(
        `/admin/sellers/${first.data.seller.id}/suspend`,
        { reason: "Data tidak valid." },
        { headers: admin }
      )

      const newEmail = `baru-${email}`
      await expect(
        api.post("/vendor/sellers", farmBody(newEmail, email), {
          headers: { authorization: `Bearer ${stale}` },
        })
      ).rejects.toMatchObject({
        response: {
          // T-021.6: the guard's refusal, not Medusa's duplicate-metadata 500
          // (NOT_ALLOWED maps to 400), in Indonesian (D-055).
          status: 400,
          data: {
            message:
              "Penolakan bersifat final. Pendaftaran tidak dapat diajukan ulang dengan akun ini.",
          },
        },
      })
      const { data: sellers } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id", "status"], filters: { email: newEmail } })
      expect(sellers).toHaveLength(0)
    })

    it("still registers a first farm from a pre-registration token", async () => {
      const container = getContainer()
      const email = `fresh-${Date.now()}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email, first_name: "Budi", last_name: "Santoso", phone: "+6281234567890" },
      ])
      await auth.updateAuthIdentities({ id: authIdentity!.id, app_metadata: { customer_id: customer.id } })

      const stale = (await api.post("/auth/member/emailpass", { email, password })).data
        .token as string
      const first = await api.post("/vendor/sellers", farmBody(email, email), {
        headers: { authorization: `Bearer ${stale}` },
      })
      expect(first.status).toEqual(201)

      const { data: sellers } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id", "status"], filters: { email } })
      expect(sellers).toHaveLength(1)
      expect(sellers[0].status).toEqual("pending_approval")
    })
  },
})
