import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(120 * 1000)

// US-092 T-092.2a. `isVendorSelfPath` skips the mask for every
// `/vendor/sellers*` request (path-based, not identity-based). This spec proves
// Mercur's own vendor seller routes bind `:id` to `req.seller_context` (the
// `x-seller-id` header checked against the member's seller_member rows), so a
// farmer can never read another farmer's record and the path skip cannot leak.
//
// Mercur 2.3.7 (read in node_modules, not modified):
// - api/middlewares.js `/vendor/*` → ensureSellerMiddleware (except
//   `/vendor/sellers` and `/vendor/sellers/select`): requires `x-seller-id`,
//   checks seller_member for {seller_id, member_id}, sets `req.seller_context`.
// - api/utils/ensure-seller-scope-middleware.js ensureSellerIdParamMiddleware:
//   `req.params.id !== req.seller_context.seller_id` → NOT_FOUND.
// - It is registered on every GET/POST `/vendor/sellers/:id...` matcher in
//   api/vendor/sellers/middlewares.js.

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

type Farm = {
  sellerId: string
  phone: string
  account: string
  holder: string
  nik: string
  memberAuth: string
  vendor: Record<string, string>
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const pg = () => getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)

    beforeAll(async () => {
      // migrationOnly mode skips the Custom Fields loader.
      await pg().raw(`
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

    let seq = 0
    const createFarm = async (): Promise<Farm> => {
      const container = getContainer()
      seq += 1
      const email = `scope-${Date.now()}-${seq}@test.dev`
      const password = "Rahasia123!"
      const phone = `+6281100000${String(seq).padStart(3, "0")}`
      const account = `98765432${String(seq).padStart(2, "0")}`
      const holder = `Petani ${seq}`
      const nik = `32730123456700${String(seq).padStart(2, "0")}`

      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${seq}`, email, currency_code: "idr" },
          payment_details: { holder_name: holder, bank_name: "BCA", account_number: account },
        },
      })

      await pg().raw(`UPDATE seller SET phone = ? WHERE id = ?`, [phone, seller.id])
      await pg().raw(
        `INSERT INTO seller_custom_fields (id, seller_id, ktp_nik) VALUES (?, ?, ?)`,
        [`selcf_${Date.now()}_${seq}`, seller.id, nik]
      )

      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const memberAuth = `Bearer ${signIn.data.token}`
      return {
        sellerId: seller.id,
        phone,
        account,
        holder,
        nik,
        memberAuth,
        vendor: { authorization: memberAuth, "x-seller-id": seller.id },
      }
    }

    const expectNoPii = (body: unknown, farm: Farm) => {
      const json = JSON.stringify(body)
      for (const full of [farm.phone, farm.account, farm.holder, farm.nik]) {
        expect(json).not.toContain(full)
      }
      expect(json).not.toContain("enc:v1:")
    }

    it("refuses another farmer's seller id and returns none of their PII", async () => {
      const a = await createFarm()
      const b = await createFarm()

      // A's token, A's own x-seller-id, B's id in the path:
      // ensureSellerIdParamMiddleware → NOT_FOUND (404).
      const crossOwnHeader = await api
        .get(`/vendor/sellers/${b.sellerId}?fields=id,phone,*payment_details`, {
          headers: a.vendor,
        })
        .then(
          (r) => r,
          (e) => e
        )
      expect(crossOwnHeader.response.status).toEqual(404)
      expectNoPii(crossOwnHeader.response.data ?? {}, b)

      // A's token, B's id in the header too: seller_member membership check in
      // ensureSellerMiddleware → NOT_ALLOWED, which Medusa maps to 400.
      const crossHeader = await api
        .get(`/vendor/sellers/${b.sellerId}`, {
          headers: { authorization: a.memberAuth, "x-seller-id": b.sellerId },
        })
        .then(
          (r) => r,
          (e) => e
        )
      expect(crossHeader.response.status).toEqual(400)
      expectNoPii(crossHeader.response.data ?? {}, b)

      // The self-id is the only id that resolves — and it resolves to A.
      expect(
        await statusOf(
          api.get(`/vendor/sellers/${a.sellerId}`, { headers: a.vendor })
        )
      ).toEqual(200)
      const own = await api.get(`/vendor/sellers/${a.sellerId}`, { headers: a.vendor })
      expect(own.data.seller).toMatchObject({
        id: a.sellerId,
        phone: a.phone,
        payment_details: { holder_name: a.holder, account_number: a.account },
      })
    })

    it("keeps the farmer's own /vendor/sellers/me record full (self-view, D-045)", async () => {
      const a = await createFarm()

      const me = await api.get("/vendor/sellers/me", { headers: a.vendor })
      expect(me.data.seller).toMatchObject({
        id: a.sellerId,
        phone: a.phone,
        payment_details: { holder_name: a.holder, account_number: a.account },
      })

      // The list route is scoped by member_id; it must not carry B's values.
      const b = await createFarm()
      const list = await api.get("/vendor/sellers", {
        headers: { authorization: a.memberAuth },
      })
      expect(list.data.seller_members).toHaveLength(1)
      expect(list.data.seller_members[0].seller).toMatchObject({ id: a.sellerId })
      expect(JSON.stringify(list.data)).not.toContain(b.phone)
    })

    it("rejects a member token with no x-seller-id (Mercur behaviour, documented)", async () => {
      const a = await createFarm()

      // ensureSellerMiddleware: NOT_ALLOWED, which Medusa maps to 400,
      // "x-seller-id header is required for vendor routes". Not changed by Koi.
      const status = await statusOf(
        api.get(`/vendor/sellers/${a.sellerId}`, {
          headers: { authorization: a.memberAuth },
        })
      )
      expect(status).toEqual(400)
    })
  },
})
