import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import passwordResetHandler, { resetUrl } from "../../src/subscribers/password-reset"

jest.setTimeout(60 * 1000)

type Sent = {
  to: string
  channel: string
  idempotency_key?: string | null
  content?: { subject?: string; html?: string; text?: string } | null
}

// Stands in for the notification module, so no SMTP server is needed. The
// provider itself (nodemailer) is never called.
const mockNotifications = (container: MedusaContainer, fail = false) => {
  const sent: Sent[] = []
  container.register(Modules.NOTIFICATION, {
    resolve: () => ({
      createNotifications: async (n: Sent) => {
        if (fail) {
          throw new Error("ECONNREFUSED mailpit:1025")
        }
        sent.push(n)
        return [n]
      },
    }),
  })
  return sent
}

const run = (container: MedusaContainer, data: Record<string, string>) =>
  passwordResetHandler({
    event: { name: "auth.password_reset", data },
    container,
    pluginOptions: {},
  } as unknown as Parameters<typeof passwordResetHandler>[0])

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("password reset email (US-002 Bug 1)", () => {
      const original = process.env.STOREFRONT_URL
      beforeEach(() => {
        process.env.STOREFRONT_URL = "http://localhost:3001/"
      })
      afterAll(() => {
        process.env.STOREFRONT_URL = original
      })

      it("emails a customer an Indonesian link to /atur-sandi with the token", async () => {
        const container = getContainer().createScope() as MedusaContainer
        const sent = mockNotifications(container)

        await run(container, {
          entity_id: "budi@koi.dev",
          token: "tok.en+/=",
          actor_type: "customer",
        })

        expect(sent).toHaveLength(1)
        const [mail] = sent
        expect(mail.to).toEqual("budi@koi.dev")
        expect(mail.channel).toEqual("email")
        expect(mail.idempotency_key).toEqual("password-reset:tok.en+/=")
        expect(mail.content?.subject).toEqual("Atur ulang kata sandi Anda")
        const link = "http://localhost:3001/atur-sandi?token=tok.en%2B%2F%3D"
        expect(mail.content?.text).toContain(link)
        expect(mail.content?.html).toContain(`href="${link}"`)
        expect(new URL(link).searchParams.get("token")).toEqual("tok.en+/=")
        expect(resetUrl("http://x", "a")).toEqual("http://x/atur-sandi?token=a")
      })

      it("sends nothing for admin (user) and farmer (member) resets", async () => {
        const container = getContainer().createScope() as MedusaContainer
        const sent = mockNotifications(container)
        for (const actor_type of ["user", "member"]) {
          await run(container, { entity_id: "a@b.dev", token: "t", actor_type })
        }
        expect(sent).toHaveLength(0)
      })

      it("does not throw when SMTP is down or STOREFRONT_URL is missing", async () => {
        const down = getContainer().createScope() as MedusaContainer
        mockNotifications(down, true)
        await expect(
          run(down, { entity_id: "a@b.dev", token: "t", actor_type: "customer" })
        ).resolves.toBeUndefined()

        delete process.env.STOREFRONT_URL
        const container = getContainer().createScope() as MedusaContainer
        const sent = mockNotifications(container)
        await run(container, { entity_id: "a@b.dev", token: "t", actor_type: "customer" })
        expect(sent).toHaveLength(0)
      })

      it("the real reset route emits auth.password_reset to this subscriber", async () => {
        await api.post("/auth/customer/emailpass/register", {
          email: "reset@koi.dev",
          password: "Rahasia123!",
        })
        const eventBus = getContainer().resolve(Modules.EVENT_BUS)
        const received: Record<string, string>[] = []
        eventBus.subscribe("auth.password_reset", async ({ data }) => {
          received.push(data as Record<string, string>)
        })

        const res = await api.post("/auth/customer/emailpass/reset-password", {
          identifier: "reset@koi.dev",
        })
        expect(res.status).toEqual(201)

        for (let i = 0; i < 50 && !received.length; i++) {
          await new Promise((r) => setTimeout(r, 100))
        }
        expect(received[0]).toEqual(
          expect.objectContaining({
            entity_id: "reset@koi.dev",
            actor_type: "customer",
            token: expect.any(String),
          })
        )
      })
    })
  },
})
