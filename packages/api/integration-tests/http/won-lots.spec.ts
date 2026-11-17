import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-051 T-051.6 / US-053 T-053.2 (D-046, D-052, D-056): the winner's own
// won-and-later lots, read only. Another customer's lot is absent and 404 by
// id; an open lot is absent; no farmer contact (phone/bank/holder) and no
// other customer field. `seller` carries only id and name, and
// `has_shipping_address` reflects the caller's own default shipping address.

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const DAY = 24 * 60 * 60 * 1000
const WINNER_PHONE = "+6281111222333"
const SELLER_PHONE = "+6289999000111"
const STREET = "Jl. Raya Bogor 1"

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

    // A seller with the private fields a leak would expose (D-052: phone must
    // never reach the winner).
    const seller = async () => {
      const sellerModule = getContainer().resolve<{
        createSellers: (
          data: Record<string, unknown>[]
        ) => Promise<{ id: string; name: string }[]>
      }>(MercurModules.SELLER)
      const [row] = await sellerModule.createSellers([
        {
          name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
          phone: SELLER_PHONE,
          currency_code: "idr",
        },
      ])
      return row
    }

    // `withAddress` adds the default shipping address `has_shipping_address`
    // reads (D-056): never selected here beyond that boolean.
    const customer = async (withAddress = false) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `won-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          phone: WINNER_PHONE,
          addresses: withAddress
            ? [
                {
                  first_name: "Budi",
                  last_name: "Santoso",
                  address_1: STREET,
                  city: "Bogor",
                  province: "Jawa Barat",
                  postal_code: "16111",
                  country_code: "id",
                  is_default_shipping: true,
                },
              ]
            : [],
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
      closedOffsetMin = 0,
      sellerId = "sel_won"
    ) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: sellerId,
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
      const farm = await seller()
      const winner = await customer(true)
      const other = await customer()
      const one = await lot("won", winner.id, 30, farm.id)
      const two = await lot("shipped", winner.id, 10, farm.id)
      await lot("paid", other.id, 0, farm.id)
      await lot("open", null, 0, farm.id)

      const res = await api.get("/store/won-lots", { headers: winner.headers })
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(2)
      expect(res.data.limit).toEqual(20)
      expect(res.data.offset).toEqual(0)
      expect(res.data.has_shipping_address).toEqual(true)
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
        seller: { id: farm.id, name: farm.name },
      })
    })

    it("has_shipping_address is false with no default shipping address, true with one", async () => {
      const winnerNoAddress = await customer()
      await lot("won", winnerNoAddress.id)
      const resNo = await api.get("/store/won-lots", {
        headers: winnerNoAddress.headers,
      })
      expect(resNo.data.has_shipping_address).toEqual(false)

      const winnerWithAddress = await customer(true)
      await lot("won", winnerWithAddress.id)
      const resYes = await api.get("/store/won-lots", {
        headers: winnerWithAddress.headers,
      })
      expect(resYes.data.has_shipping_address).toEqual(true)
    })

    it("returns delivered_at and seller on a delivered lot", async () => {
      const farm = await seller()
      const winner = await customer()
      const lotId = await lot("delivered", winner.id, 0, farm.id)

      const res = await api.get(`/store/won-lots/${lotId}`, {
        headers: winner.headers,
      })
      expect(res.status).toEqual(200)
      expect(res.data.has_shipping_address).toEqual(false)
      expect(res.data.lot).toMatchObject({
        id: lotId,
        status: "delivered",
        delivered_at: expect.any(String),
        seller: { id: farm.id, name: farm.name },
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

    it("returns no farmer contact, no address and no other customer field (D-052, D-056)", async () => {
      const farm = await seller()
      const winner = await customer()
      const lotId = await lot("shipped", winner.id, 0, farm.id)

      const res = await api.get("/store/won-lots", { headers: winner.headers })
      const json = JSON.stringify(res.data)
      for (const forbidden of [
        "phone",
        "bank",
        "holder",
        "address_1",
        "winner_customer_id",
        winner.id,
        WINNER_PHONE,
        SELLER_PHONE,
        STREET,
      ]) {
        expect(json).not.toContain(forbidden)
      }
      // The farm name and id are the only seller fields; no other seller field.
      expect(res.data.lots[0].seller).toEqual({ id: farm.id, name: farm.name })
      expect(
        JSON.stringify(
          (await api.get(`/store/won-lots/${lotId}`, { headers: winner.headers }))
            .data
        )
      ).not.toContain("phone")
    })
  },
})
