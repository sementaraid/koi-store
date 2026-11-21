import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import { isPiiEncrypted } from "../../src/utils/pii-crypto"

jest.setTimeout(120 * 1000)

const NIK = "3273012345678901"
const ACCOUNT = "1234567890"
const HOLDER = "Budi Santoso"
const CUSTOMER_PHONE = "+6281234567890"

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

// US-092 T-092.1 (AC1, AC6, D-043). A write through the real routes stores
// ciphertext in the PII columns; the read path returns plaintext or a mask. The
// direct database read is the proof: it sees `enc:v1:...`, not the value.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: Record<string, string>

    // migrationOnly mode skips the Custom Fields loader (see
    // farm-registration.spec.ts).
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
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    const pg = () => getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)

    const adminHeaders = async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `enc-admin-${Date.now()}-${Math.random()}@test.dev` }])
      const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
        .projectConfig
      const token = generateJwtToken(
        {
          actor_id: user.id,
          actor_type: "user",
          auth_identity_id: "",
          app_metadata: {},
          user_metadata: {},
        },
        { secret: http.jwtSecret, expiresIn: "1h" }
      )
      return { authorization: `Bearer ${token}` }
    }

    const phoneRow = async (table: string, id: string) => {
      const result = await pg().raw(`SELECT phone FROM ${table} WHERE id = ?`, [id])
      const rows = (result.rows ?? result) as { phone?: string | null }[]
      return rows[0]?.phone ?? null
    }

    it("stores the customer phone as ciphertext and returns it plaintext to its owner (AC1)", async () => {
      const email = `enc-phone-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const created = await api.post(
        "/store/customers",
        { email, first_name: "Budi", last_name: "Santoso", phone: CUSTOMER_PHONE },
        {
          headers: { ...storeHeaders, authorization: `Bearer ${registered.data.token}` },
        }
      )
      const customer = created.data.customer as { id: string; phone: string }

      const stored = await phoneRow("customer", customer.id)
      expect(isPiiEncrypted(stored)).toBe(true)
      expect(stored).not.toContain(CUSTOMER_PHONE)

      // D-045: the owner still sees the plaintext on their own record.
      const login = await api.post(
        "/auth/customer/emailpass",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const me = await api.get("/store/customers/me", {
        headers: {
          ...storeHeaders,
          authorization: `Bearer ${login.data.token}`,
        },
      })
      expect(me.data.customer.phone).toEqual(CUSTOMER_PHONE)

      // An admin sees only the mask (D-042).
      const admin = await adminHeaders()
      const detail = await api.get(`/admin/customers/${customer.id}`, {
        headers: admin,
      })
      expect(detail.data.customer.phone).toEqual("+62********890")
    })

    it("stores the farm's phone, bank details and NIK as ciphertext, returns masks and reveals plaintext (AC1)", async () => {
      const email = `enc-farm-${Date.now()}@test.dev`
      const password = "Rahasia123!"
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password },
        { headers: storeHeaders }
      )
      const created = await api.post(
        "/store/customers",
        { email, first_name: "Budi", last_name: "Santoso", phone: CUSTOMER_PHONE },
        {
          headers: { ...storeHeaders, authorization: `Bearer ${registered.data.token}` },
        }
      )
      const customerId = (created.data.customer as { id: string }).id
      const member = await api.post(
        "/auth/member/emailpass",
        { email, password },
        { headers: storeHeaders }
      )

      // The real registration route: phone copied from the (encrypted)
      // customer, bank details and Custom Fields encrypted by the middleware.
      const response = await api.post(
        "/vendor/sellers",
        {
          name: `Kebun ${Date.now()}`,
          email,
          member_email: email,
          currency_code: "idr",
          address: {
            address_1: "Jl. Raya Bogor 1",
            city: "Bogor",
            province: "Jawa Barat",
          },
          payment_details: { holder_name: HOLDER, bank_name: "BCA", account_number: ACCOUNT },
          additional_data: {
            ktp_photo_key: "private-ktp.png",
            ktp_nik: NIK,
            farm_photo_urls: ["http://localhost:9000/static/kebun.jpg"],
          },
        },
        {
          headers: {
            ...storeHeaders,
            authorization: `Bearer ${member.data.token}`,
          },
        }
      )
      expect(response.status).toEqual(201)
      const sellerId = (response.data.seller as { id: string }).id
      expect(response.data.seller.phone).toEqual(CUSTOMER_PHONE)

      const detailsResult = await pg().raw(
        `SELECT holder_name, account_number, bank_name FROM payment_details WHERE seller_id = ?`,
        [sellerId]
      )
      const [details] = ((detailsResult.rows ?? detailsResult) as Record<string, string>[])
      const farmResult = await pg().raw(
        `SELECT ktp_nik FROM seller_custom_fields WHERE seller_id = ?`,
        [sellerId]
      )
      const [farm] = ((farmResult.rows ?? farmResult) as { ktp_nik: string }[])
      const sellerPhone = await phoneRow("seller", sellerId)

      // AC1: disk holds ciphertext for every in-scope column.
      for (const value of [
        sellerPhone,
        details.holder_name,
        details.account_number,
        farm.ktp_nik,
      ]) {
        expect(isPiiEncrypted(value)).toBe(true)
      }
      expect(details.bank_name).toEqual("BCA") // not PII, stays plaintext
      // The phone was copied from the already-encrypted customer: encrypting
      // again must not double-wrap it.
      expect(sellerPhone).not.toContain("enc:v1:enc:v1:")

      // Admin queue: masks computed from the plaintext, never ciphertext.
      const admin = await adminHeaders()
      const farmDetail = await api.get(`/admin/farms/${sellerId}`, { headers: admin })
      expect(farmDetail.data.farm).toMatchObject({
        ktp_nik: "3273**********01",
        phone: "+62********890",
        payment_details: {
          holder_name: "B*** S******",
          bank_name: "BCA",
          account_number: "******7890",
        },
      })
      expect(JSON.stringify(farmDetail.data)).not.toContain("enc:v1:")

      // The logged reveal returns the plaintext (D-042).
      const reveal = await api.post(
        `/admin/farms/${sellerId}/reveal`,
        { field: "phone" },
        { headers: admin }
      )
      expect(reveal.data.value).toEqual(CUSTOMER_PHONE)

      // The farmer's own record returns plaintext for their own fields (D-045).
      // Sign in again: the member gains its seller role at registration.
      const memberAgain = await api.post(
        "/auth/member/emailpass",
        { email, password },
        { headers: storeHeaders }
      )
      const self = await api.get(`/vendor/sellers/${sellerId}`, {
        headers: {
          ...storeHeaders,
          authorization: `Bearer ${memberAgain.data.token}`,
          "x-seller-id": sellerId,
        },
      })
      expect(self.data.seller.payment_details.account_number).toEqual(ACCOUNT)
      void customerId
    })

    it("stores a saved shipping address's phone as ciphertext (AC1)", async () => {
      const email = `enc-addr-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      await api.post(
        "/store/customers",
        { email, first_name: "Budi", last_name: "Santoso", phone: CUSTOMER_PHONE },
        { headers: { ...storeHeaders, authorization: `Bearer ${registered.data.token}` } }
      )
      const login = await api.post(
        "/auth/customer/emailpass",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const customerToken = login.data.token as string
      const address = await api.post(
        "/store/customers/me/addresses",
        {
          first_name: "Budi",
          last_name: "Santoso",
          address_1: "Jl. Raya Bogor 1",
          city: "Bogor",
          province: "Jawa Barat",
          country_code: "id",
          phone: "+6287777666555",
          is_default_shipping: true,
        },
        {
          headers: { ...storeHeaders, authorization: `Bearer ${customerToken}` },
        }
      )
      const addressId = (address.data.customer?.addresses?.[0] ?? address.data.address)
        ?.id as string

      const result = await pg().raw(`SELECT phone FROM customer_address WHERE id = ?`, [
        addressId,
      ])
      const [row] = (result.rows ?? result) as { phone: string }[]
      expect(isPiiEncrypted(row.phone)).toBe(true)

      // The owner reads their own full address phone (D-045).
      const me = await api.get("/store/customers/me?fields=*addresses", {
        headers: { ...storeHeaders, authorization: `Bearer ${customerToken}` },
      })
      expect(me.data.customer.addresses[0].phone).toEqual("+6287777666555")
    })

    it("still refuses a malformed phone with the encryption middleware in place", async () => {
      const email = `enc-bad-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const status = await statusOf(
        api.post(
          "/store/customers",
          { email, first_name: "B", last_name: "S", phone: "12345" },
          {
            headers: { ...storeHeaders, authorization: `Bearer ${registered.data.token}` },
          }
        )
      )
      expect(status).toEqual(400)
    })
  },
})
