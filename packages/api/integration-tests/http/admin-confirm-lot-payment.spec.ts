import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { setLotFieldsStep } from "../../src/workflows/steps/lot"

jest.setTimeout(120 * 1000)

// US-108 T-108.1 (AC3, D-068, D-072): an admin confirms the winner's transfer;
// `won → paid` with `paid_at` (server time) and the admin's id. Any other
// status, a second confirm included, is a 409. Admin token only.

const DAY = 24 * 60 * 60 * 1000
const OB = 100_000

type HttpResponse = {
  status: number
  data: {
    message?: string
    lot?: Record<string, unknown>
  }
}

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "customer" | "user" | "member"
) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type,
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

// The real lot write, then a failure, so its compensation runs.
const failAfterPaidStep = createStep("qa-fail-after-paid", async () => {
  throw new Error("qa: simulated failure after the lot write")
})
const writeThenFailWorkflow = createWorkflow(
  "confirm-lot-payment-then-fail-test",
  function (input: { lot_id: string; admin_id: string }) {
    setLotFieldsStep({
      id: input.lot_id,
      update: {
        status: "paid",
        paid_at: new Date("2026-11-25T00:00:00Z"),
        paid_confirmed_by: input.admin_id,
      },
    })
    failAfterPaidStep()
  }
)

type StoredLot = {
  id: string
  status: string
  paid_at: Date | string | null
  paid_confirmed_by: string | null
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const lot = async (status: string) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: "sel_confirm",
          fee_category_id: "feecat_confirm",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed" as never,
          payer_customer_id: "cus_farmer",
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_confirm",
          ob: OB,
          kb: 50_000,
          current_price: 150_000,
          end_time: new Date(Date.now() - DAY),
          status: status as never,
          winner_customer_id: "cus_winner",
          final_price: 150_000,
          closed_at: new Date(Date.now() - DAY),
        },
      ])
      return row
    }

    const confirm = (
      lotId: string,
      headers: Record<string, string> = admin
    ) => api.post(`/admin/lots/${lotId}/confirm-payment`, {}, { headers })

    const lotById = async (id: string) => {
      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "lot",
          fields: ["id", "status", "paid_at", "paid_confirmed_by"],
          filters: { id },
        })
      return row as StoredLot
    }

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `confirm-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
    })

    it("moves a won lot to paid with paid_at (server time) and the admin's id (AC3)", async () => {
      const seeded = await lot("won")
      const before = Date.now()

      const res = await confirm(seeded.id)
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: seeded.id,
        status: "paid",
        paid_confirmed_by: adminId,
      })

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("paid")
      expect(stored.paid_confirmed_by).toEqual(adminId)
      const paidAt = new Date(stored.paid_at as string).getTime()
      expect(paidAt).toBeGreaterThanOrEqual(before - 1000)
      expect(paidAt).toBeLessThanOrEqual(Date.now() + 1000)
      expect(new Date(res.data.lot!.paid_at as string).getTime()).toEqual(paidAt)
    })

    it("409s a second confirm and keeps the first paid_at and admin (AC3)", async () => {
      const seeded = await lot("won")
      expect((await confirm(seeded.id)).status).toEqual(200)
      const first = await lotById(seeded.id)

      const res = await failure(confirm(seeded.id))
      expect(res.status).toEqual(409)

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("paid")
      expect(new Date(stored.paid_at as string).getTime()).toEqual(
        new Date(first.paid_at as string).getTime()
      )
      expect(stored.paid_confirmed_by).toEqual(adminId)
    })

    it("409s every status but won and writes nothing (AC3)", async () => {
      for (const status of [
        "open",
        "unsold",
        "paid",
        "shipped",
        "delivered",
        "claimed",
        "cancelled",
      ] as const) {
        const seeded = await lot(status)
        const res = await failure(confirm(seeded.id))
        expect(res.status).toEqual(409)

        const stored = await lotById(seeded.id)
        expect(stored.status).toEqual(status)
        expect(stored.paid_at).toBeNull()
        expect(stored.paid_confirmed_by).toBeNull()
      }
    })

    it("404s an unknown lot", async () => {
      expect((await failure(confirm("lot_does_not_exist"))).status).toEqual(404)
    })

    it("401s no token, a customer token and a member token (D-002)", async () => {
      const seeded = await lot("won")
      const container = getContainer()
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email: `confirm-cus-${Date.now()}@test.dev` }])

      for (const headers of [
        {} as Record<string, string>,
        { authorization: `Bearer ${jwt(container, customer.id, "customer")}` },
        { authorization: `Bearer ${jwt(container, "mem_confirm", "member")}` },
      ]) {
        expect((await failure(confirm(seeded.id, headers))).status).toEqual(401)
      }

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("won")
      expect(stored.paid_at).toBeNull()
    })

    it("restores status, paid_at and paid_confirmed_by when a later step fails", async () => {
      const seeded = await lot("won")

      await expect(
        writeThenFailWorkflow(getContainer()).run({
          input: { lot_id: seeded.id, admin_id: adminId },
        })
      ).rejects.toBeTruthy()

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("won")
      expect(stored.paid_at).toBeNull()
      expect(stored.paid_confirmed_by).toBeNull()
    })
  },
})
