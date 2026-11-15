import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"

jest.setTimeout(120 * 1000)

// US-092 T-092.2 (D-039, D-042): Mercur's and Medusa's own routes mask PII.
// Full values stay only on the caller's own record (owner self-view exception)
// and on the logged farm reveal.

const SELLER_PHONE = "+6281111222333"
const APPLICANT_PHONE = "+6281234567890"
const ACCOUNT = "1234567890"
const HOLDER = "Budi Santoso"

const MASKED = {
  phone: "+62********333",
  account_number: "******7890",
  holder_name: "B*** S******",
}

type HttpError = { response: { status: number } }

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    {
      actor_id: userId,
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
    let admin: Record<string, string>
    let apiKey: string

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `pii-leak-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      apiKey = key.token
    })

    // A farm as US-020 leaves it, plus a customer linked to its seller (the
    // seller_customer link that /vendor/customers filters on).
    const registerFarm = async (opts: { approved?: boolean } = {}) => {
      const container = getContainer()
      const email = `pii-leak-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email,
          first_name: "Budi",
          last_name: "Santoso",
          phone: APPLICANT_PHONE,
        },
      ])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })

      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          payment_details: {
            holder_name: HOLDER,
            bank_name: "BCA",
            account_number: ACCOUNT,
          },
        },
      })

      const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      await pg.raw(`UPDATE seller SET phone = ? WHERE id = ?`, [SELLER_PHONE, seller.id])
      // The link Medusa creates when a customer first orders from a seller;
      // /vendor/customers only lists customers whose seller_id is this seller.
      await pg.raw(
        `INSERT INTO seller_seller_customer_customer (id, seller_id, customer_id)
         VALUES (?, ?, ?)`,
        [`sellcus_${Date.now()}`, seller.id, customer.id]
      )

      if (opts.approved) {
        await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
      }

      const memberSignIn = await api.post("/auth/member/emailpass", { email, password })
      const customerSignIn = await api.post("/auth/customer/emailpass", { email, password })
      return {
        seller,
        customer,
        email,
        member: { authorization: `Bearer ${memberSignIn.data.token}` },
        vendor: {
          authorization: `Bearer ${memberSignIn.data.token}`,
          "x-seller-id": seller.id,
        },
        customerHeaders: { authorization: `Bearer ${customerSignIn.data.token}` },
        store: { "x-publishable-api-key": apiKey },
      }
    }

    const expectNoFullPii = (body: unknown) => {
      const json = JSON.stringify(body)
      for (const full of [SELLER_PHONE, ACCOUNT, HOLDER, APPLICANT_PHONE]) {
        expect(json).not.toContain(full)
      }
    }

    it("masks a seller's phone and bank details on the admin seller routes (T-092.2)", async () => {
      const { seller } = await registerFarm()

      const list = await api.get("/admin/sellers?limit=100", { headers: admin })
      const listSeller = list.data.sellers.find((s: { id: string }) => s.id === seller.id)
      expect(listSeller).toMatchObject({
        phone: MASKED.phone,
        payment_details: { holder_name: MASKED.holder_name, account_number: MASKED.account_number },
      })
      expectNoFullPii(list.data)

      const detail = await api.get(`/admin/sellers/${seller.id}`, { headers: admin })
      expect(detail.data.seller).toMatchObject({
        phone: MASKED.phone,
        payment_details: { holder_name: MASKED.holder_name, account_number: MASKED.account_number },
      })
      expectNoFullPii(detail.data)

      // The lifecycle replies echo the seller too (approve/suspend).
      const approved = await api.post(`/admin/sellers/${seller.id}/approve`, {}, { headers: admin })
      expectNoFullPii(approved.data)
      const suspended = await api.post(
        `/admin/sellers/${seller.id}/suspend`,
        { reason: "Data rekening tidak cocok." },
        { headers: admin }
      )
      expect(suspended.data.seller.payment_details.account_number).toEqual(
        MASKED.account_number
      )
      expectNoFullPii(suspended.data)
    })

    it("keeps the farmer's own phone and bank details on their own /vendor/sellers record", async () => {
      const { seller, vendor } = await registerFarm()

      const me = await api.get("/vendor/sellers/me", { headers: vendor })
      expect(me.data.seller).toMatchObject({
        id: seller.id,
        phone: SELLER_PHONE,
        payment_details: { holder_name: HOLDER, account_number: ACCOUNT },
      })

      const byId = await api.get(`/vendor/sellers/${seller.id}`, { headers: vendor })
      expect(byId.data.seller).toMatchObject({ phone: SELLER_PHONE })

      const mine = await api.get("/vendor/sellers", {
        headers: { authorization: vendor.authorization },
      })
      expect(mine.data.seller_members[0].seller).toMatchObject({ phone: SELLER_PHONE })
    })

    it("never returns a customer's full phone to a farmer (D-044)", async () => {
      const { customer, vendor } = await registerFarm()

      const res = await api.get("/vendor/customers", { headers: vendor })
      expect(res.status).toEqual(200)
      const listed = res.data.customers.find((c: { id: string }) => c.id === customer.id)
      expect(listed).toMatchObject({ id: customer.id, phone: "+62********890" })
      expect(JSON.stringify(res.data)).not.toContain(APPLICANT_PHONE)

      const detail = await api.get(`/vendor/customers/${customer.id}`, { headers: vendor })
      expect(detail.data.customer.phone).toEqual("+62********890")
      expect(JSON.stringify(detail.data)).not.toContain(APPLICANT_PHONE)
    })

    it("masks a seller's phone on the public /store/sellers routes", async () => {
      const { seller, store } = await registerFarm({ approved: true })

      const list = await api.get("/store/sellers?fields=id,name,+phone", {
        headers: store,
      })
      const listed = list.data.sellers.find((s: { id: string }) => s.id === seller.id)
      expect(listed.phone).toEqual(MASKED.phone)
      expect(JSON.stringify(list.data)).not.toContain(SELLER_PHONE)

      const detail = await api.get(`/store/sellers/${seller.id}?fields=id,name,+phone`, {
        headers: store,
      })
      expect(detail.data.seller.phone).toEqual(MASKED.phone)
    })

    it("keeps a customer's own full phone on their own account (self-view exception)", async () => {
      const { customerHeaders, store } = await registerFarm()

      const me = await api.get("/store/customers/me?fields=+phone", {
        headers: { ...store, ...customerHeaders },
      })
      expect(me.data.customer.phone).toEqual(APPLICANT_PHONE)
    })

    it("masks customer phones on the admin customer search", async () => {
      const { customer, email } = await registerFarm()

      const res = await api.get(`/admin/customers?q=${email}`, { headers: admin })
      const found = res.data.customers.find((c: { id: string }) => c.id === customer.id)
      expect(found.phone).toEqual("+62********890")
      expect(JSON.stringify(res.data)).not.toContain(APPLICANT_PHONE)
    })

    it("still refuses a non-admin token on the admin seller routes", async () => {
      const { seller, customerHeaders } = await registerFarm()
      const statusOf = (p: Promise<unknown>) =>
        p.then(() => 200).catch((e: HttpError) => e.response.status)

      expect(await statusOf(api.get("/admin/sellers", { headers: customerHeaders }))).toEqual(
        401
      )
      expect(
        await statusOf(api.get(`/admin/sellers/${seller.id}`, { headers: customerHeaders }))
      ).toEqual(401)
    })
  },
})
