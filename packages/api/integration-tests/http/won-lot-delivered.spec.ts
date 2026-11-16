import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { setLotFieldsStep } from "../../src/workflows/steps/lot"

jest.setTimeout(120 * 1000)

// US-053 T-053.1 (AC1, D-046 reading, D-053): the winner marks a shipped lot
// delivered. Anyone else gets 404 (no existence leak); only `shipped` moves.

// The real mutation, then a failure, so its compensation runs.
const failAfterLotFieldsStep = createStep("qa-fail-after-lot-fields", async () => {
  throw new Error("qa: simulated failure after setLotFieldsStep")
})
const setLotFieldsThenFailWorkflow = createWorkflow(
  "set-lot-fields-then-fail-test",
  function (input: { id: string; update: { status: "delivered" } }) {
    setLotFieldsStep(input)
    failAfterLotFieldsStep()
  }
)

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const DAY = 24 * 60 * 60 * 1000

const jwt = (container: MedusaContainer, actor_id: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type: "customer",
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
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `won-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
        },
      ])
      return {
        id: row.id,
        headers: {
          authorization: `Bearer ${jwt(container, row.id)}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    // A closed auction with one lot in the given status, won by `winner`.
    const wonLot = async (status: LotStatus, winnerId: string) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: "sel_delivered",
          fee_category_id: "feecat_delivered",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_delivered_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status,
          winner_customer_id: winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
        },
      ])
      return row.id
    }

    const deliver = (headers: Record<string, string>, lotId: string) =>
      statusOf(api.post(`/store/won-lots/${lotId}/delivered`, {}, { headers }))

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("lets the winner mark a shipped lot delivered and saves delivered_at (AC1)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)
      const before = Date.now()

      const res = await api.post(
        `/store/won-lots/${lotId}/delivered`,
        {},
        { headers: winner.headers }
      )
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({ id: lotId, status: "delivered" })
      expect(new Date(res.data.lot.delivered_at).getTime()).toBeGreaterThanOrEqual(
        before - 1000
      )

      const row = await auctions().retrieveLot(lotId)
      expect(row.status).toEqual("delivered")
      expect(row.delivered_at).toBeTruthy()
      // A repeat is refused and the saved time is not overwritten.
      expect(await deliver(winner.headers, lotId)).toEqual(409)
      expect((await auctions().retrieveLot(lotId)).delivered_at).toEqual(
        row.delivered_at
      )
    })

    it("404s another customer and leaves the lot unchanged (AC1)", async () => {
      const winner = await customer()
      const other = await customer()
      const lotId = await wonLot("shipped", winner.id)

      expect(await deliver(other.headers, lotId)).toEqual(404)
      expect((await auctions().retrieveLot(lotId)).status).toEqual("shipped")
    })

    it("refuses anonymous callers with 401 (AC1)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      expect(
        await statusOf(
          api.post(`/store/won-lots/${lotId}/delivered`, {}, {
            headers: { "x-publishable-api-key": publishable },
          })
        )
      ).toEqual(401)
      expect((await auctions().retrieveLot(lotId)).status).toEqual("shipped")
    })

    it("refuses won, paid and open lots with 409 (AC1)", async () => {
      const winner = await customer()
      const won = await wonLot("won", winner.id)
      const paid = await wonLot("paid", winner.id)
      const open_ = await wonLot("open", winner.id)

      expect(await deliver(winner.headers, won)).toEqual(409)
      expect(await deliver(winner.headers, paid)).toEqual(409)
      expect(await deliver(winner.headers, open_)).toEqual(409)
      expect((await auctions().retrieveLot(won)).status).toEqual("won")
      expect((await auctions().retrieveLot(paid)).status).toEqual("paid")
    })

    it("takes no body", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      expect(
        await statusOf(
          api.post(
            `/store/won-lots/${lotId}/delivered`,
            { status: "delivered" },
            { headers: winner.headers }
          )
        )
      ).toEqual(400)
      expect((await auctions().retrieveLot(lotId)).status).toEqual("shipped")
    })

    it("restores the lot when a later step fails (compensation)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      const run = await setLotFieldsThenFailWorkflow(getContainer()).run({
        input: { id: lotId, update: { status: "delivered" } },
        throwOnError: false,
      })
      expect(run.errors?.length).toBeGreaterThan(0)
      const row = await auctions().retrieveLot(lotId)
      expect(row.status).toEqual("shipped")
      expect(row.delivered_at).toBeNull()
    })
  },
})
