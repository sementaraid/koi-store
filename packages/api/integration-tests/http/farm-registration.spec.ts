import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(120 * 1000)

// 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

const form = (
  purpose: string | undefined,
  file: { data: Buffer; type: string; name: string } | undefined
) => {
  const body = new FormData()
  if (purpose !== undefined) body.append("purpose", purpose)
  if (file) {
    body.append(
      "file",
      new Blob([new Uint8Array(file.data)], { type: file.type }),
      file.name
    )
  }
  return body
}

const png = { data: PNG, type: "image/png", name: "foto.png" }

// The member token's claims, decoded without a jwt dependency.
const claimsOf = (token: string) => {
  const [, payload] = token.split(".")
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    actor_id: string
    actor_type: string
    app_metadata: Record<string, unknown>
  }
}

type CustomFieldsService = {
  upsert(alias: string, data: { id: string } & Record<string, unknown>): Promise<unknown>
  list(
    alias: string,
    filters: Record<string, unknown>,
    config?: Record<string, unknown>
  ): Promise<Record<string, unknown>[]>
}

type HttpError = { response: { status: number; data: unknown } }

const statusOf = (p: Promise<unknown>) =>
  p.then(() => 200).catch((e: HttpError) => e.response.status)

// US-020, T-020.1/T-020.5/T-020.6/T-020.7/T-020.8. The full registration
// sequence the storefront runs: customer sign-up, member sign-in, upload KTP and
// a farm photo, POST /vendor/sellers, then member sign-in again.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let apiKey: string
    let storeHeaders: Record<string, string>

    // The Custom Fields module creates `seller_custom_fields` when the app is
    // migrated (`medusa db:migrate`). The test runner migrates in
    // migrationOnly mode, where module loaders (and the table sync) don't run,
    // so the suite creates the same table first; the runner snapshots it as
    // part of this suite's template.
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
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      apiKey = key.token
      storeHeaders = { "x-publishable-api-key": apiKey }
    })

    const registerCustomer = async (email: string, password: string, phone?: string) => {
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password },
        { headers: storeHeaders }
      )
      const created = await api.post(
        "/store/customers",
        { email, first_name: "Budi", last_name: "Santoso", ...(phone ? { phone } : {}) },
        {
          headers: {
            ...storeHeaders,
            authorization: `Bearer ${registered.data.token}`,
          },
        }
      )
      return created.data.customer as { id: string; email: string; phone: string }
    }

    const signIn = async (actor: "customer" | "member", email: string, password: string) => {
      const res = await api.post(`/auth/${actor}/emailpass`, { email, password }, { headers: storeHeaders })
      return res.data.token as string
    }
    const memberToken = (email: string, password: string) => signIn("member", email, password)

    const upload = async (
      purpose: string | undefined,
      file: { data: Buffer; type: string; name: string } | undefined,
      token: string
    ) =>
      api.post("/store/farm-uploads", form(purpose, file), {
        headers: { ...storeHeaders, authorization: `Bearer ${token}` },
      })

    const registrationBody = (overrides: Record<string, unknown> = {}) => ({
      name: `Kebun Koi ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
      currency_code: "idr",
      description: "Kebun koi di Bogor.",
      address: { address_1: "Jl. Raya Bogor 1", city: "Bogor", province: "Jawa Barat" },
      payment_details: {
        holder_name: "Budi Santoso",
        bank_name: "Bank BCA",
        account_number: "1234567890",
      },
      additional_data: {
        ktp_photo_key: "private-1700000000000-ktp.jpg",
        ktp_nik: "3273012345678901",
        farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
      },
      ...overrides,
    })

    const registeredFarm = async (options: { phone?: string } = {}) => {
      const email = `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const customer = await registerCustomer(email, password, options.phone ?? "+6281234567890")
      const token = await memberToken(email, password)
      const customerToken = await signIn("customer", email, password)

      // The registration photos, uploaded as the customer before the seller
      // exists (T-020.5).
      const ktp = await upload("ktp", png, customerToken)
      const farmPhoto = await upload("farm", png, customerToken)

      const body = registrationBody({
        email,
        member_email: email,
        additional_data: {
          ktp_photo_key: ktp.data.file_key,
          ktp_nik: "3273012345678901",
          farm_photo_urls: [farmPhoto.data.url],
        },
      })

      return { email, password, customer, token, customerToken, ktp, farmPhoto, body }
    }

    it("registers a farm, copies the phone and saves the private KTP fields (AC1, AC2, AC4)", async () => {
      const { email, password, body } = await registeredFarm()

      // The body's phone is ignored: D-016 says the registration phone wins.
      const response = await api.post(
        "/vendor/sellers",
        { ...body, phone: "+620000000000" },
        { headers: { ...storeHeaders, authorization: `Bearer ${await memberToken(email, password)}` } }
      )

      expect(response.status).toEqual(201)
      const seller = response.data.seller
      expect(seller.status).toEqual("pending_approval")
      expect(seller.phone).toEqual("+6281234567890")
      expect(seller.email).toEqual(email)

      const container = getContainer()
      const customFields = container.resolve<CustomFieldsService>(
        MercurModules.CUSTOM_FIELDS
      )
      const [stored] = await customFields.list("seller", { seller_id: seller.id }, {})
      const submitted = body.additional_data as { ktp_photo_key: string; farm_photo_urls: string[] }
      expect(submitted.ktp_photo_key).toMatch(/^private-/)
      expect(stored).toMatchObject({
        ktp_photo_key: submitted.ktp_photo_key,
        ktp_nik: "3273012345678901",
        farm_photo_urls: submitted.farm_photo_urls,
      })

      // AC2: the same credentials sign in as a member again, now with the actor.
      const reLogin = await memberToken(email, password)
      const claims = claimsOf(reLogin)
      const { data: members } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "member", fields: ["id"], filters: { email } })
      expect(claims.actor_id).toEqual(members[0].id)
      expect(claims.app_metadata.member_id).toEqual(members[0].id)
      expect(claims.app_metadata.customer_id).toEqual(
        expect.any(String)
      )
    })

    it("uploads the KTP privately and farm photos publicly (T-020.5)", async () => {
      const { customerToken } = await registeredFarm()

      const ktp = await upload("ktp", png, customerToken)
      expect(ktp.status).toEqual(200)
      expect(ktp.data.file_key).toMatch(/^private-/)
      // No URL for a private file (D-017/D-018).
      expect(ktp.data.url).toBeUndefined()

      const farm = await upload("farm", png, customerToken)
      expect(farm.status).toEqual(200)
      expect(farm.data.file_key).not.toMatch(/^private-/)
      expect(farm.data.url).toMatch(/^http/)

      // Only images, only customers.
      expect(await statusOf(upload("ktp", { data: Buffer.from("x"), type: "text/plain", name: "a.txt" }, customerToken))).toEqual(400)
      expect(await statusOf(upload("ktp", { data: Buffer.alloc(5 * 1024 * 1024 + 1), type: "image/png", name: "big.png" }, customerToken))).toEqual(400)
      expect(await statusOf(upload("paspor", png, customerToken))).toEqual(400)
      expect(await statusOf(upload("ktp", png, ""))).toEqual(401)
      expect(await statusOf(upload(undefined, png, customerToken))).toEqual(400)
    })

    it("rejects a member_email that is not the caller's email and writes nothing (AC6)", async () => {
      const { email, password, body } = await registeredFarm()
      const token = await memberToken(email, password)
      const container = getContainer()

      const status = await statusOf(
        api.post(
          "/vendor/sellers",
          { ...body, member_email: "someone.else@test.dev" },
          { headers: { ...storeHeaders, authorization: `Bearer ${token}` } }
        )
      )
      expect(status).toEqual(403)

      const { data: sellers } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id"], filters: { email } })
      expect(sellers).toHaveLength(0)
      const { data: members } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "member", fields: ["id"], filters: { email } })
      expect(members).toHaveLength(0)
    })

    it("requires the farm fields, a customer phone and a customer identity (AC1, AC4)", async () => {
      const { email, password, body } = await registeredFarm()
      const token = await memberToken(email, password)
      const post = (payload: Record<string, unknown>, bearer = token) =>
        statusOf(api.post("/vendor/sellers", payload, {
          headers: { ...storeHeaders, authorization: `Bearer ${bearer}` },
        }))

      // AC1: each required field individually.
      expect(await post(registrationBody({ email, member_email: email, address: undefined }))).toEqual(400)
      expect(
        await post(
          registrationBody({
            email,
            member_email: email,
            payment_details: { holder_name: "Budi", bank_name: null, account_number: null },
          })
        )
      ).toEqual(400)
      expect(
        await post(
          registrationBody({
            email,
            member_email: email,
            additional_data: { ...(body.additional_data as object), ktp_nik: "123" },
          })
        )
      ).toEqual(400)
      expect(
        await post(
          registrationBody({
            email,
            member_email: email,
            additional_data: { ...(body.additional_data as object), ktp_photo_key: "public-ktp.jpg" },
          })
        )
      ).toEqual(400)
      expect(
        await post(
          registrationBody({
            email,
            member_email: email,
            additional_data: { ...(body.additional_data as object), farm_photo_urls: [] },
          })
        )
      ).toEqual(400)

      // Nothing was created by the refused requests.
      const { data: sellers } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "seller", fields: ["id"], filters: { email } })
      expect(sellers).toHaveLength(0)

      const container = getContainer()
      const auth = container.resolve(Modules.AUTH)
      const customerModule = container.resolve(Modules.CUSTOMER)

      // A member identity with no customer attached.
      const memberOnlyEmail = `member-only-${Date.now()}@test.dev`
      await auth.register("emailpass", { body: { email: memberOnlyEmail, password } })
      const memberOnlyToken = await memberToken(memberOnlyEmail, password)
      expect(
        await post(registrationBody({ email: memberOnlyEmail, member_email: memberOnlyEmail }), memberOnlyToken)
      ).toEqual(400)

      // A customer with no phone.
      const noPhoneEmail = `no-phone-${Date.now()}@test.dev`
      const registered = await auth.register("emailpass", { body: { email: noPhoneEmail, password } })
      const [noPhoneCustomer] = await customerModule.createCustomers([{ email: noPhoneEmail }])
      await auth.updateAuthIdentities({
        id: registered.authIdentity!.id,
        app_metadata: { customer_id: noPhoneCustomer.id },
      })
      const noPhoneToken = await memberToken(noPhoneEmail, password)
      const noPhoneStatus = await post(
        registrationBody({ email: noPhoneEmail, member_email: noPhoneEmail }),
        noPhoneToken
      )
      expect(noPhoneStatus).toEqual(400)
    })

    it("never returns the bank, business or KTP fields from /store/sellers (T-020.6, AC5)", async () => {
      const container = getContainer()
      const email = `public-seller-${Date.now()}@test.dev`
      const registered = await container
        .resolve(Modules.AUTH)
        .register("emailpass", { body: { email, password: "Rahasia123!" } })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: registered.authIdentity!.id,
          member_email: email,
          seller: { name: `Farm ${Date.now()}`, email, currency_code: "idr" },
          payment_details: { holder_name: "Budi", bank_name: "BCA", account_number: "1234567890" },
        },
      })
      await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
      await container.resolve<CustomFieldsService>(MercurModules.CUSTOM_FIELDS).upsert("seller", {
        id: seller.id,
        ktp_photo_key: "private-1700000000000-ktp.jpg",
        ktp_nik: "3273012345678901",
        farm_photo_urls: [],
      })

      const forbidden = "payment_details holder_name bank_name account_number professional_details custom_fields ktp_photo_key ktp_nik ktp_nik".split(" ")

      for (const path of [
        `/store/sellers/${seller.id}?fields=+payment_details.*,+professional_details.*,+custom_fields.*`,
        `/store/sellers/${seller.id}`,
        `/store/sellers?fields=+payment_details.*,+professional_details.*,+custom_fields.*`,
        `/store/sellers`,
      ]) {
        const response = await api.get(path, { headers: storeHeaders })
        expect(response.status).toEqual(200)
        const serialized = JSON.stringify(response.data)
        for (const field of forbidden) {
          expect({ path, field, leaked: serialized.includes(field) }).toEqual({
            path,
            field,
            leaked: false,
          })
        }
      }

      // The private key is not served either; the row exists but stays out of
      // the public response.
      const [stored] = await container
        .resolve<CustomFieldsService>(MercurModules.CUSTOM_FIELDS)
        .list("seller", { seller_id: seller.id }, {})
      expect(stored.ktp_nik).toEqual("3273012345678901")
    })

    it("lets the farmer read the registration status (AC3)", async () => {
      const { email, password, body } = await registeredFarm()
      const token = await memberToken(email, password)
      const created = await api.post("/vendor/sellers", body, {
        headers: { ...storeHeaders, authorization: `Bearer ${token}` },
      })
      const sellerId = created.data.seller.id

      const fresh = await memberToken(email, password)

      // The member's sellers list carries the seller status.
      const list = await api.get("/vendor/sellers", {
        headers: { ...storeHeaders, authorization: `Bearer ${fresh}` },
      })
      expect(list.status).toEqual(200)
      expect(list.data.seller_members[0].seller.status).toEqual("pending_approval")

      // The seller's own record too; status_reason is requestable (US-021).
      const me = await api.get(`/vendor/sellers/me?fields=+status_reason`, {
        headers: {
          ...storeHeaders,
          authorization: `Bearer ${fresh}`,
          "x-seller-id": sellerId,
        },
      })
      expect(me.status).toEqual(200)
      expect(me.data.seller.status).toEqual("pending_approval")
      expect(me.data.seller).toHaveProperty("status_reason")
      expect(me.data.seller.status_reason).toBeNull()
    })
  },
})
