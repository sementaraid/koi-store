import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
  generateJwtToken,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  APPROVED_FEE_CATEGORIES,
  seedFeeCategories,
} from "../../src/scripts/seed-fee-categories"

jest.setTimeout(60 * 1000)

const jwt = (container: MedusaContainer, actorId: string, actorType: string) => {
  const { http } = container.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  ).projectConfig
  return generateJwtToken(
    {
      actor_id: actorId,
      actor_type: actorType,
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(() => 200).catch((e: HttpError) => e.response.status)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("/admin/fee-categories", () => {
      let auth: { headers: { authorization: string } }

      beforeEach(async () => {
        const container = getContainer()
        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `fee-admin-${Date.now()}@test.dev` }])
        auth = { headers: { authorization: `Bearer ${jwt(container, user.id, "user")}` } }
      })

      it("rejects requests without an admin token", async () => {
        expect(await statusOf(api.get("/admin/fee-categories"))).toEqual(401)
        expect(
          await statusOf(
            api.post("/admin/fee-categories", { name: "X", listing_fee: 1, join_fee: 1 })
          )
        ).toEqual(401)
        expect(await statusOf(api.delete("/admin/fee-categories/feecat_x"))).toEqual(401)

        const container = getContainer()
        const [customer] = await container
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `fee-cust-${Date.now()}@test.dev` }])
        expect(
          await statusOf(
            api.get("/admin/fee-categories", {
              headers: { authorization: `Bearer ${jwt(container, customer.id, "customer")}` },
            })
          )
        ).toEqual(401)
      })

      it("seed creates the four approved categories exactly once (AC2)", async () => {
        const container = getContainer()
        expect(await seedFeeCategories(container)).toEqual(4)
        expect(await seedFeeCategories(container)).toEqual(0) // re-run is a no-op

        const response = await api.get("/admin/fee-categories", auth)
        expect(response.status).toEqual(200)
        expect(
          response.data.fee_categories.map(
            ({ name, listing_fee, join_fee }: Record<string, unknown>) => ({
              name,
              listing_fee,
              join_fee,
            })
          )
        ).toEqual(APPROVED_FEE_CATEGORIES)
        expect(APPROVED_FEE_CATEGORIES).toEqual([
          { name: "Lokal, no certificate", listing_fee: 50_000, join_fee: 100_000 },
          { name: "Lokal, certificate", listing_fee: 100_000, join_fee: 250_000 },
          { name: "Import, certificate", listing_fee: 200_000, join_fee: 500_000 },
          { name: "Premium", listing_fee: 400_000, join_fee: 1_000_000 },
        ])
      })

      it("creates, updates (POST /:id, partial) and deletes a category", async () => {
        const created = await api.post(
          "/admin/fee-categories",
          { name: "Jumbo", listing_fee: 300_000, join_fee: 750_000 },
          auth
        )
        expect(created.status).toEqual(200)
        const { id } = created.data.fee_category
        expect(created.data.fee_category).toEqual({
          id: expect.stringMatching(/^feecat_/),
          name: "Jumbo",
          listing_fee: 300_000,
          join_fee: 750_000,
        })

        const updated = await api.post(
          `/admin/fee-categories/${id}`,
          { join_fee: 800_000 },
          auth
        )
        expect(updated.status).toEqual(200)
        expect(updated.data.fee_category).toEqual({
          id,
          name: "Jumbo",
          listing_fee: 300_000,
          join_fee: 800_000,
        })

        const deleted = await api.delete(`/admin/fee-categories/${id}`, auth)
        expect(deleted.data).toEqual({ id, object: "fee_category", deleted: true })

        const list = await api.get("/admin/fee-categories", auth)
        expect(list.data.fee_categories.map((c: { id: string }) => c.id)).not.toContain(id)

        // A deleted name can be reused (unique index covers live rows only).
        expect(
          await statusOf(
            api.post("/admin/fee-categories", { name: "Jumbo", listing_fee: 1, join_fee: 1 }, auth)
          )
        ).toEqual(200)
      })

      it("rejects non-integer, negative, missing and unknown fields", async () => {
        const post = (body: Record<string, unknown>) =>
          statusOf(api.post("/admin/fee-categories", body, auth))

        expect(await post({ name: "A", listing_fee: 1.5, join_fee: 1 })).toEqual(400)
        expect(await post({ name: "A", listing_fee: -1, join_fee: 1 })).toEqual(400)
        expect(await post({ name: "A", listing_fee: "1000", join_fee: 1 })).toEqual(400)
        expect(await post({ name: " ", listing_fee: 1, join_fee: 1 })).toEqual(400)
        expect(await post({ name: "A", listing_fee: 1 })).toEqual(400)
        expect(await post({ name: "A", listing_fee: 1, join_fee: 1, extra: 1 })).toEqual(400)
      })

      it("refuses a duplicate name, also under concurrent creates", async () => {
        const body = { name: "Dup", listing_fee: 1, join_fee: 1 }
        const results = await Promise.all([
          statusOf(api.post("/admin/fee-categories", body, auth)),
          statusOf(api.post("/admin/fee-categories", body, auth)),
        ])
        expect(results.sort()).toEqual([200, expect.any(Number)])
        expect(results.filter((s) => s === 200)).toHaveLength(1)

        const list = await api.get("/admin/fee-categories", auth)
        expect(
          list.data.fee_categories.filter((c: { name: string }) => c.name === "Dup")
        ).toHaveLength(1)
      })

      it("returns 404 when updating or deleting an unknown id", async () => {
        expect(
          await statusOf(api.post("/admin/fee-categories/feecat_nope", { join_fee: 1 }, auth))
        ).toEqual(404)
        expect(await statusOf(api.delete("/admin/fee-categories/feecat_nope", auth))).toEqual(404)
      })

      it("leaves /admin/settings working (US-015)", async () => {
        const response = await api.post(
          "/admin/settings",
          { bank_name: "BCA" },
          auth
        )
        expect(response.status).toEqual(200)
        expect(response.data.settings.bank_name).toEqual("BCA")
      })
    })
  },
})
