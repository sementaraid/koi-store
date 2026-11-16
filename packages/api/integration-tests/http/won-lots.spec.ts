import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-051 T-051.6 / US-053 T-053.2 (D-046, D-052): the winner's own won-and-
// later lots, read only. Another customer's lot is absent and 404 by id; an
// open lot is absent; no farmer contact and no other customer field.

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const DAY = 24 * 60 * 60 * 1000
const WINNER_PHONE = "+6281111222333"

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
          phone: WINNER_PHONE,
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

    // A lot in the given status. `closedOffsetMin` orders the list.
    const lot = async (
      status: LotStatus,
      winnerId: string | null,
      closedOffsetMin = 0
    ) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: "sel_won",
          fee_category_id: "feecat_won",
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
          product_id: "prod_won_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status,
          winner_customer_id: winnerId,
          final_price: winnerId ? 1_500_000 : null,
          closed_at: winnerId
            ? new Date(Date.now() - closedOffsetMin * 60_000)
            : null,
          tracking_number: status === "shipped" ? "JNE12345" : null,
          delivered_at:
            status === "delivered" ? new Date(Date.now() - 60_000) : null,
        },
      ])
      return row.id
    }

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("lists only the caller's won-and-later lots, newest closed first", async () => {
      const winner = await customer()
      const other = await customer()
      const one = await lot("won", winner.id, 30)
      const two = await lot("shipped", winner.id, 10)
      await lot("paid", other.id)
      await lot("open", null)

      const res = await api.get("/store/won-lots", { headers: winner.headers })
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(2)
      expect(res.data.limit).toEqual(20)
      expect(res.data.offset).toEqual(0)
      expect(res.data.lots.map((l: { id: string }) => l.id)).toEqual([two, one])

      const shipped = res.data.lots[0]
      expect(shipped).toEqual({
        id: two,
        status: "shipped",
        final_price: 1_500_000,
        closed_at: expect.any(String),
        tracking_number: "JNE12345",
        delivered_at: null,
        auction: { id: expect.any(String), delivery_method: "courier" },
        product: { title: null, thumbnail: null },
      })
    })

    it("returns delivered_at on a delivered lot", async () => {
      const winner = await customer()
      const lotId = await lot("delivered", winner.id)

      const res = await api.get(`/store/won-lots/${lotId}`, {
        headers: winner.headers,
      })
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: lotId,
        status: "delivered",
        delivered_at: expect.any(String),
      })
    })

    it("404s another customer's lot and an open lot, by id", async () => {
      const winner = await customer()
      const other = await customer()
      const theirs = await lot("won", other.id)
      const open = await lot("open", null)

      expect(
        await statusOf(
          api.get(`/store/won-lots/${theirs}`, { headers: winner.headers })
        )
      ).toEqual(404)
      expect(
        await statusOf(
          api.get(`/store/won-lots/${open}`, { headers: winner.headers })
        )
      ).toEqual(404)
    })

    it("refuses anonymous callers with 401", async () => {
      expect(
        await statusOf(
          api.get("/store/won-lots", {
            headers: { "x-publishable-api-key": publishable },
          })
        )
      ).toEqual(401)
      expect(
        await statusOf(
          api.get("/store/won-lots/lot_whatever", {
            headers: { "x-publishable-api-key": publishable },
          })
        )
      ).toEqual(401)
    })

    it("returns no farmer contact and no other customer field (D-052)", async () => {
      const winner = await customer()
      const lotId = await lot("shipped", winner.id)

      const res = await api.get("/store/won-lots", { headers: winner.headers })
      const json = JSON.stringify(res.data)
      for (const forbidden of [
        "phone",
        "bank",
        "holder",
        "winner_customer_id",
        winner.id,
        WINNER_PHONE,
        "seller",
      ]) {
        expect(json).not.toContain(forbidden)
      }
      // Only the auction id names the seller side.
      expect(res.data.lots[0].auction.id).toBeTruthy()
      expect(
        JSON.stringify(
          (await api.get(`/store/won-lots/${lotId}`, { headers: winner.headers }))
            .data
        )
      ).not.toContain("phone")
    })
  },
})
