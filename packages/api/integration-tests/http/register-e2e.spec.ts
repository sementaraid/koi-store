import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

jest.setTimeout(60 * 1000)

// US-002 AC1/AC3 end to end: the storefront's exact sequence (emailpass
// register, then POST /store/customers with name, email, phone, password
// already set on the identity) creates the customer, stores the phone, and the
// customer.created event creates exactly one wallet (D-011).
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const walletsOf = async (customerId: string) => {
      const { data } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "customer_wallet",
          fields: ["wallet_id"],
          filters: { customer_id: customerId },
        })
      return data
    }

    it("registers a customer, saves the phone and creates exactly one wallet", async () => {
      const [apiKey] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      const headers = { "x-publishable-api-key": apiKey.token }

      const email = `ac1-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers }
      )
      const token = registered.data.token as string

      const created = await api.post(
        "/store/customers",
        {
          email,
          first_name: "Budi",
          last_name: "Santoso",
          phone: "+62 812-3456-7890",
        },
        { headers: { ...headers, authorization: `Bearer ${token}` } }
      )
      expect(created.status).toEqual(200)
      const customer = created.data.customer
      expect(customer.email).toEqual(email)
      expect(customer.phone).toEqual("+6281234567890")

      // Sign in with the same credentials (AC2's sign-in half).
      const login = await api.post(
        "/auth/customer/emailpass",
        { email, password: "Rahasia123!" },
        { headers }
      )
      expect(login.status).toEqual(200)
      expect(typeof login.data.token).toEqual("string")

      // Wallet is created from customer.created; the event bus is async.
      for (let i = 0; i < 50 && !(await walletsOf(customer.id)).length; i++) {
        await new Promise((r) => setTimeout(r, 100))
      }
      expect(await walletsOf(customer.id)).toHaveLength(1)
    })
  },
})
