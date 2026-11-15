import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import platformSettingSingleton from "../../src/migration-scripts/platform-setting-singleton"

jest.setTimeout(60 * 1000)

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig
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
    describe("/admin/settings", () => {
      let token: string

      beforeEach(async () => {
        const container = getContainer()
        const userModule = container.resolve(Modules.USER)
        const [user] = await userModule.createUsers([
          { email: `admin-${Date.now()}@test.dev` },
        ])
        token = adminJwt(container, user.id)
      })

      it("rejects a request without a token", async () => {
        const get = await api
          .get("/admin/settings")
          .catch((e: { response: { status: number } }) => e)
        expect(get.response.status).toEqual(401)

        const post = await api
          .post("/admin/settings", { extend_window_minutes: 9 })
          .catch((e: { response: { status: number } }) => e)
        expect(post.response.status).toEqual(401)
      })

      it("rejects a customer token", async () => {
        const container = getContainer()
        const [customer] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `not-admin-${Date.now()}@test.dev` }])
        const { http } = container.resolve(
          ContainerRegistrationKeys.CONFIG_MODULE
        ).projectConfig
        const customerToken = generateJwtToken(
          {
            actor_id: customer.id,
            actor_type: "customer",
            auth_identity_id: "",
            app_metadata: {},
            user_metadata: {},
          },
          { secret: http.jwtSecret, expiresIn: "1h" }
        )

        const error = await api
          .get("/admin/settings", {
            headers: { authorization: `Bearer ${customerToken}` },
          })
          .catch((e: { response: { status: number } }) => e)

        expect(error.response.status).toEqual(401)
      })

      it("returns defaults without writing a row", async () => {
        const response = await api.get("/admin/settings", {
          headers: { authorization: `Bearer ${token}` },
        })

        expect(response.status).toEqual(200)
        expect(response.data.settings).toEqual({
          extend_window_minutes: 5,
          max_lots_per_auction: 20,
          auction_min_days: 1,
          auction_max_days: 7,
          claim_window_hours: 4,
          bank_name: "",
          bank_account_number: "",
          bank_account_holder: "",
        })

        // GET is read-only: no row was created.
        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "platform_setting",
          fields: ["id"],
        })
        expect(data).toHaveLength(0)
      })

      it("applies a partial update and keeps the other values", async () => {
        const response = await api.post(
          "/admin/settings",
          { extend_window_minutes: 9, bank_name: "BCA" },
          { headers: { authorization: `Bearer ${token}` } }
        )

        expect(response.status).toEqual(200)
        expect(response.data.settings.extend_window_minutes).toEqual(9)
        expect(response.data.settings.bank_name).toEqual("BCA")
        expect(response.data.settings.max_lots_per_auction).toEqual(20)

        // The row persists for the next read.
        const read = await api.get("/admin/settings", {
          headers: { authorization: `Bearer ${token}` },
        })
        expect(read.data.settings.extend_window_minutes).toEqual(9)
      })

      it("rejects auction_min_days greater than auction_max_days", async () => {
        const error = await api
          .post(
            "/admin/settings",
            { auction_min_days: 10 },
            { headers: { authorization: `Bearer ${token}` } }
          )
          .catch((e: { response: { status: number } }) => e)

        expect(error.response.status).toEqual(400)

        // Nothing changed.
        const read = await api.get("/admin/settings", {
          headers: { authorization: `Bearer ${token}` },
        })
        expect(read.data.settings.auction_min_days).toEqual(1)
      })

      it("rejects an unknown key (Medusa's zodValidator forces strict)", async () => {
        const error = await api
          .post(
            "/admin/settings",
            { not_a_setting: true },
            { headers: { authorization: `Bearer ${token}` } }
          )
          .catch((e: { response: { status: number; data: { message?: string } } }) => e)

        expect(error.response.status).toEqual(400)
        expect(error.response.data.message).toMatch(/Unrecognized fields/)
      })

      it("keeps one settings row under concurrent first writes", async () => {
        const auth = { headers: { authorization: `Bearer ${token}` } }
        await Promise.all([
          api.post("/admin/settings", { extend_window_minutes: 7 }, auth),
          api.post("/admin/settings", { max_lots_per_auction: 30 }, auth),
        ])

        const query = getContainer().resolve(ContainerRegistrationKeys.QUERY)
        const { data } = await query.graph({
          entity: "platform_setting",
          fields: ["id"],
        })
        expect(data).toHaveLength(1)
      })

      it("the database rejects a second settings row", async () => {
        const auth = { headers: { authorization: `Bearer ${token}` } }
        await api.post("/admin/settings", { extend_window_minutes: 7 }, auth)

        const container = getContainer()
        // The integration runner runs module migrations but not migration
        // scripts (db:migrate does), so apply the project's index here.
        await platformSettingSingleton({ container, args: [] })
        const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        await expect(
          pg.raw(`INSERT INTO platform_setting (id) VALUES ('pset_duplicate')`)
        ).rejects.toThrow(/UQ_platform_setting_singleton/)
      })

      it("releases the lock when a save fails", async () => {
        const auth = { headers: { authorization: `Bearer ${token}` } }
        // min > max: fails after the lock is taken.
        const failed = await api
          .post("/admin/settings", { auction_min_days: 30 }, auth)
          .catch((e: { response: { status: number } }) => e)
        expect(failed.response.status).toEqual(400)

        // A later save still gets the lock; otherwise it times out at 10s.
        const after = await api.post(
          "/admin/settings",
          { extend_window_minutes: 6 },
          auth
        )
        expect(after.status).toEqual(200)
        expect(after.data.settings.extend_window_minutes).toEqual(6)
      })

      it("rejects a non-integer value", async () => {
        const error = await api
          .post(
            "/admin/settings",
            { extend_window_minutes: 1.5 },
            { headers: { authorization: `Bearer ${token}` } }
          )
          .catch((e: { response: { status: number } }) => e)

        expect(error.response.status).toEqual(400)
      })
    })
  },
})
