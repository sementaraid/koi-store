import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

jest.setTimeout(60 * 1000)

type HttpError = { response: { status: number } }

// US-002 AC3 / D-008: the backend, not only the storefront form, requires a
// valid phone on registration and refuses to clear it later.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("customer phone (D-008)", () => {
      let key: string

      beforeEach(async () => {
        const [apiKey] = await getContainer()
          .resolve(Modules.API_KEY)
          .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
        key = apiKey.token
      })

      // Real flow: register an emailpass identity, then create the customer.
      const registrationToken = async (email: string) => {
        const res = await api.post("/auth/customer/emailpass/register", {
          email,
          password: "Rahasia123!",
        })
        return res.data.token as string
      }

      const createCustomer = async (body: Record<string, unknown>) => {
        const email = `phone-${Date.now()}-${Math.random()}@test.dev`
        const token = await registrationToken(email)
        return api.post(
          "/store/customers",
          { email, first_name: "Budi", last_name: "Santoso", ...body },
          { headers: { authorization: `Bearer ${token}`, "x-publishable-api-key": key } }
        )
      }

      const statusOf = (p: Promise<unknown>) =>
        p.then(() => 200).catch((e: HttpError) => e.response.status)

      it("refuses registration without a phone, or with an empty one", async () => {
        expect(await statusOf(createCustomer({}))).toEqual(400)
        expect(await statusOf(createCustomer({ phone: null }))).toEqual(400)
        expect(await statusOf(createCustomer({ phone: "   " }))).toEqual(400)
        expect(await statusOf(createCustomer({ phone: " - - " }))).toEqual(400)
      })

      it("refuses a malformed phone", async () => {
        for (const phone of ["12345", "0812abc456", "++62812345", "1".repeat(21), 812345678]) {
          const status = await statusOf(createCustomer({ phone }))
          expect({ phone, status }).toEqual({ phone, status: 400 })
        }
      })

      it("accepts a valid phone and saves it without spaces or dashes", async () => {
        const res = await createCustomer({ phone: " +62 812-3456-7890 " })
        expect(res.status).toEqual(200)
        expect(res.data.customer.phone).toEqual("+6281234567890")
      })

      describe("POST /store/customers/me", () => {
        let headers: Record<string, string>

        beforeEach(async () => {
          const email = `me-${Date.now()}@test.dev`
          const token = await registrationToken(email)
          await api.post(
            "/store/customers",
            { email, first_name: "Budi", last_name: "Santoso", phone: "081234567890" },
            { headers: { authorization: `Bearer ${token}`, "x-publishable-api-key": key } }
          )
          const login = await api.post("/auth/customer/emailpass", {
            email,
            password: "Rahasia123!",
          })
          headers = { authorization: `Bearer ${login.data.token}`, "x-publishable-api-key": key }
        })

        it("refuses clearing the phone", async () => {
          for (const phone of [null, "", "  "]) {
            const status = await statusOf(api.post("/store/customers/me", { phone }, { headers }))
            expect({ phone, status }).toEqual({ phone, status: 400 })
          }
          const me = await api.get("/store/customers/me", { headers })
          expect(me.data.customer.phone).toEqual("081234567890")
        })

        it("refuses a malformed new phone", async () => {
          expect(
            await statusOf(api.post("/store/customers/me", { phone: "abc" }, { headers }))
          ).toEqual(400)
        })

        it("allows changing to another valid phone, and edits that omit it", async () => {
          const changed = await api.post(
            "/store/customers/me",
            { phone: "0857-1111-2222" },
            { headers }
          )
          expect(changed.status).toEqual(200)
          expect(changed.data.customer.phone).toEqual("085711112222")

          const nameOnly = await api.post("/store/customers/me", { first_name: "Andi" }, { headers })
          expect(nameOnly.status).toEqual(200)
          expect(nameOnly.data.customer.phone).toEqual("085711112222")
        })
      })
    })
  },
})
