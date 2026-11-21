import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import { validateSellerOpenStep } from "../../src/workflows/steps/validate-seller-open"

jest.setTimeout(120 * 1000)

// 1x1 PNG.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

type HttpError = { response: { status: number; data: { message?: string } } }

const statusOf = (p: Promise<unknown>) =>
  p.then(() => 200).catch((e: HttpError) => e.response.status)

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id: userId, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

// T-021.5: what every custom /vendor/* workflow does first (US-030 onwards).
const farmerActionWorkflow = createWorkflow(
  "test-farmer-action",
  function (input: { seller_id: string }) {
    validateSellerOpenStep(input)
    return new WorkflowResponse(input.seller_id)
  }
)

// The error type the open-status step raised, or undefined when it passed.
// Read from `errors` with throwOnError off: in this suite a rejected run did
// not surface as a thrown promise.
const farmerActionError = async (container: MedusaContainer, sellerId: string) => {
  const { errors } = await farmerActionWorkflow(container).run({
    input: { seller_id: sellerId },
    throwOnError: false,
  })
  return (errors[0]?.error as { type?: string } | undefined)?.type
}

// US-021 T-021.1 / T-021.5.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let storeHeaders: Record<string, string>

    // Same side table as farm-registration.spec.ts: migrationOnly mode skips
    // the Custom Fields loader that creates it on `medusa db:migrate`.
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
        .createUsers([{ email: `farm-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    // A registered farm as US-020 leaves it: customer + member on one auth
    // identity (D-003), a private KTP upload, the farm Custom Fields.
    const registerFarm = async () => {
      const container = getContainer()
      const email = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email, first_name: "Budi", last_name: "Santoso", phone: "+6281234567890" },
      ])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })

      const { result: [ktp] } = await uploadFarmFileWorkflow(container).run({
        input: { filename: "ktp.png", mimeType: "image/png", content: PNG_BASE64, access: "private" },
      })

      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          address: { address_1: "Jl. Raya Bogor 1", city: "Bogor", province: "Jawa Barat" },
          payment_details: { holder_name: "Budi Santoso", bank_name: "BCA", account_number: "1234567890" },
          additional_data: {
            ktp_photo_key: ktp.id,
            ktp_nik: "3273012345678901",
            farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
          },
        },
      })

      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const vendor = { authorization: `Bearer ${signIn.data.token}`, "x-seller-id": seller.id }
      const member = { authorization: `Bearer ${signIn.data.token}` }
      return { seller, customer, email, password, vendor, member }
    }

    const sellerStatus = async (id: string) => {
      const { data: [s] } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["status", "status_reason", "rejected_at"], filters: { id } })
      return s
    }

    it("lists pending farms with the private registration data, admins only (AC1)", async () => {
      const { seller, customer } = await registerFarm()

      const list = await api.get("/admin/farms?limit=100", { headers: admin })
      expect(list.status).toEqual(200)
      const farm = list.data.farms.find((f: { id: string }) => f.id === seller.id)
      expect(farm).toMatchObject({
        status: "pending_approval",
        // US-092 (D-042): masked; full values only via POST .../reveal.
        ktp_nik: "3273**********01",
        has_ktp_photo: true,
        farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
        payment_details: { holder_name: "B*** S******", bank_name: "BCA", account_number: "******7890" },
        address: { address_1: "Jl. Raya Bogor 1", city: "Bogor", province: "Jawa Barat" },
        applicant: { customer_id: customer.id, first_name: "Budi", last_name: "Santoso", phone: "+62********890" },
        holder_matches_applicant: true,
      })
      // The key is never sent, only the boolean (D-017).
      expect(JSON.stringify(list.data)).not.toContain("private-")

      const detail = await api.get(`/admin/farms/${seller.id}`, { headers: admin })
      expect(detail.data.farm).toMatchObject({ id: seller.id, ktp_nik: "3273**********01" })
      expect(await statusOf(api.get("/admin/farms/sel_missing", { headers: admin }))).toEqual(404)

      const ktp = await api.get(`/admin/farms/${seller.id}/ktp`, {
        headers: admin,
        responseType: "arraybuffer",
      })
      expect(ktp.status).toEqual(200)
      expect(ktp.headers["content-type"]).toEqual("image/png")
      expect(ktp.headers["cache-control"]).toEqual("private, no-store")
      expect(Buffer.from(ktp.data).equals(Buffer.from(PNG_BASE64, "base64"))).toBe(true)

      // A pending queue never shows an approved farm.
      const approvedOnly = await api.get("/admin/farms?status=open&limit=100", { headers: admin })
      expect(approvedOnly.data.farms.map((f: { id: string }) => f.id)).not.toContain(seller.id)
      expect(await statusOf(api.get("/admin/farms?status=nope", { headers: admin }))).toEqual(400)

      // No admin token, no data. A customer token is refused too.
      expect(await statusOf(api.get("/admin/farms"))).toEqual(401)
      expect(await statusOf(api.get(`/admin/farms/${seller.id}/ktp`))).toEqual(401)
    })

    it("refuses a customer token and a member token on every admin farm route (AC1, D-002)", async () => {
      const { seller, email, password, vendor, member } = await registerFarm()
      const customerSignIn = await api.post("/auth/customer/emailpass", { email, password })
      const customer = { authorization: `Bearer ${customerSignIn.data.token}` }

      for (const headers of [customer, member, vendor]) {
        expect(await statusOf(api.get("/admin/farms", { headers }))).toEqual(401)
        expect(await statusOf(api.get(`/admin/farms/${seller.id}`, { headers }))).toEqual(401)
        expect(await statusOf(api.get(`/admin/farms/${seller.id}/ktp`, { headers }))).toEqual(401)
        expect(
          await statusOf(api.post(`/admin/sellers/${seller.id}/approve`, {}, { headers }))
        ).toEqual(401)
        expect(
          await statusOf(api.post(`/admin/sellers/${seller.id}/suspend`, { reason: "x" }, { headers }))
        ).toEqual(401)
      }
      expect((await sellerStatus(seller.id)).status).toEqual("pending_approval")
    })

    it("approving opens farmer actions on the same member token (AC2, AC4)", async () => {
      const container = getContainer()
      const { seller, vendor } = await registerFarm()

      // Pending: farmer actions are closed.
      expect(await farmerActionError(container, seller.id)).toEqual("forbidden")

      const approved = await api.post(`/admin/sellers/${seller.id}/approve`, {}, { headers: admin })
      expect(approved.data.seller.status).toEqual("open")

      // No new login needed: the member token from before approval sees open.
      const me = await api.get("/vendor/sellers/me", { headers: vendor })
      expect(me.data.seller.status).toEqual("open")
      expect(await farmerActionError(container, seller.id)).toBeUndefined()
    })

    it("rejects with a required reason the farmer reads, final (AC2, AC3, AC4)", async () => {
      const container = getContainer()
      const { seller, vendor } = await registerFarm()

      // A reason is required and must not be blank.
      expect(await statusOf(api.post(`/admin/sellers/${seller.id}/suspend`, {}, { headers: admin }))).toEqual(400)
      expect(
        await statusOf(api.post(`/admin/sellers/${seller.id}/suspend`, { reason: "  " }, { headers: admin }))
      ).toEqual(400)
      expect((await sellerStatus(seller.id)).status).toEqual("pending_approval")

      const reason = "Nama rekening tidak sama dengan KTP."
      const rejected = await api.post(`/admin/sellers/${seller.id}/suspend`, { reason }, { headers: admin })
      expect(rejected.data.seller).toMatchObject({ status: "suspended", status_reason: reason })
      expect(rejected.data.seller.rejected_at).toBeTruthy()

      // The farmer sees the reason through /vendor (T-021.3 reads these).
      const me = await api.get("/vendor/sellers/me?fields=+status_reason", { headers: vendor })
      expect(me.data.seller).toMatchObject({ status: "suspended", status_reason: reason })
      const mine = await api.get("/vendor/sellers", { headers: { authorization: vendor.authorization } })
      expect(mine.data.seller_members[0].seller).toMatchObject({ status: "suspended", status_reason: reason })

      // Final: no unsuspend, no approve, and farmer actions stay closed.
      expect(await statusOf(api.post(`/admin/sellers/${seller.id}/unsuspend`, {}, { headers: admin }))).toEqual(400)
      expect(await statusOf(api.post(`/admin/sellers/${seller.id}/approve`, {}, { headers: admin }))).toEqual(400)
      expect(await sellerStatus(seller.id)).toMatchObject({ status: "suspended", status_reason: reason })
      expect(await farmerActionError(container, seller.id)).toEqual("forbidden")

      // The rejected farm shows in the suspended list with its reason.
      const list = await api.get("/admin/farms?status=suspended&limit=100", { headers: admin })
      expect(list.data.farms.find((f: { id: string }) => f.id === seller.id)).toMatchObject({
        status_reason: reason,
      })
    })

    it("refuses a rejected member's second registration, even with a new seller email (AC3, D-015)", async () => {
      const container = getContainer()
      const { email, member } = await registerFarm()

      // Rejection is the admin suspend (D-015), and the reason is required.
      const [{ id: rejectedId }] = (await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id"], filters: { email } })).data
      await api.post(`/admin/sellers/${rejectedId}/suspend`, { reason: "Data tidak valid." }, { headers: admin })

      // Same member, different seller email: the bypass qa reported.
      const newEmail = `baru-${email}`
      const body = {
        name: `Kebun Baru ${Date.now()}`,
        email: newEmail,
        currency_code: "idr",
        member_email: email,
        address: { address_1: "Jl. Baru 2", city: "Bogor", province: "Jawa Barat" },
        payment_details: { holder_name: "Budi Santoso", bank_name: "BCA", account_number: "1234567891" },
        additional_data: {
          ktp_photo_key: "private-resubmit-ktp.png",
          ktp_nik: "3273012345678901",
          farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
        },
      }

      const resubmit = api.post("/vendor/sellers", body, { headers: member })
      await expect(resubmit).rejects.toMatchObject({
        response: {
          // NOT_ALLOWED maps to 400, like the unsuspend guard above.
          status: 400,
          data: {
            message:
              "Penolakan bersifat final. Pendaftaran tidak dapat diajukan ulang dengan akun ini.",
          },
        },
      })

      // Nothing was written: no seller under the new email, and the member
      // still belongs to exactly the rejected seller.
      const { data: sellers } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id"], filters: { email: newEmail } })
      expect(sellers).toHaveLength(0)
      const { data: members } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "member", fields: ["id"], filters: { email } })
      const { data: links } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller_member", fields: ["seller_id"], filters: { member_id: members[0].id } })
      expect(links.map((l: { seller_id: string }) => l.seller_id)).toEqual([rejectedId])
    })

    it("keeps unsuspend for a farm suspended after approval (not a rejection)", async () => {
      const { email, member, seller } = await registerFarm()
      await api.post(`/admin/sellers/${seller.id}/approve`, {}, { headers: admin })
      await api.post(`/admin/sellers/${seller.id}/suspend`, { reason: "Banned" }, { headers: admin })

      const back = await api.post(`/admin/sellers/${seller.id}/unsuspend`, {}, { headers: admin })
      expect(back.data.seller.status).toEqual("open")

      // The new registration check must not catch a post-approval suspend:
      // only a rejected registration (`approved_at` null) is final. Re-suspend
      // so the seller is suspended while the member registers again.
      await api.post(`/admin/sellers/${seller.id}/suspend`, { reason: "Banned" }, { headers: admin })
      const second = await api.post(
        "/vendor/sellers",
        {
          name: `Kebun Kedua ${Date.now()}`,
          email: `kedua-${email}`,
          currency_code: "idr",
          member_email: email,
          address: { address_1: "Jl. Kedua 3", city: "Bogor", province: "Jawa Barat" },
          payment_details: { holder_name: "Budi Santoso", bank_name: "BCA", account_number: "1234567892" },
          additional_data: {
            ktp_photo_key: "private-kedua-ktp.png",
            ktp_nik: "3273012345678901",
            farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
          },
        },
        { headers: member }
      )
      expect(second.status).toEqual(201)
      expect(second.data.seller.status).toEqual("pending_approval")
    })
  },
})
