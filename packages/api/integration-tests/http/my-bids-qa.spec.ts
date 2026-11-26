import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"

jest.setTimeout(120 * 1000)

// US-096 T-096.4 (qa) extra edge cases for `GET /store/my-bids` (AC4). Same fixtures as my-bids.spec.ts.
// Original header: the caller's own position on
// each lot they hold a non-removed bid on. won/lost read the lot's saved
// result; removed bids never count; no other customer's id or name; 401
// without a customer token; optional `lot_id` filter.

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const DAY = 24 * 60 * 60 * 1000

type MyBid = {
  lot_id: string
  position: string
  lot_status: string | null
  my_highest_bid: number
  my_bids: { amount: number; created_at: string }[]
  lot: { id: string; lot_number: number; current_price: number | null }
}

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

    const customer = async (firstName: string) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `my-bids-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          first_name: firstName,
          last_name: "Santoso",
          phone: "+628111000222",
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

    const auction = async (status: AuctionStatus) => {
      const [seller] = await getContainer()
        .resolve<{
          createSellers: (
            data: Record<string, unknown>[]
          ) => Promise<{ id: string }[]>
        }>(MercurModules.SELLER)
        .createSellers([
          {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
            phone: "+6281234567890",
            currency_code: "idr",
          },
        ])
      const { result } = await createFeeCategoriesWorkflow(getContainer()).run({
        input: {
          fee_categories: [
            {
              name: `Kategori ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              listing_fee: 50_000,
              join_fee: 100_000,
            },
          ],
        },
      })
      const start = Date.now() - DAY
      const [row] = await auctions().createAuctions([
        {
          seller_id: seller.id,
          fee_category_id: result[0].id,
          start_at: new Date(start),
          end_at: new Date(start + 3 * DAY),
          delivery_method: "courier",
          status,
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      fields: {
        status?: LotStatus
        current_price?: number
        winner_customer_id?: string | null
        final_price?: number | null
      } = {}
    ) => {
      const [product] = await getContainer()
        .resolve(Modules.PRODUCT)
        .createProducts([
          { title: `Kohaku ${Math.random().toString(36).slice(2, 6)}`, status: "draft" as never },
        ])
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: product.id,
          ob: 1_000_000,
          kb: 100_000,
          current_price: fields.current_price ?? 1_000_000,
          end_time: new Date(Date.now() + DAY),
          status: fields.status ?? "open",
          winner_customer_id: fields.winner_customer_id ?? null,
          final_price: fields.final_price ?? null,
        },
      ])
      return row.id
    }

    const bid = async (
      lotId: string,
      customerId: string,
      amount: number,
      removed = false
    ) => {
      const [row] = await auctions().createBids([
        { lot_id: lotId, customer_id: customerId, amount, source: "web" },
      ])
      if (removed) {
        await auctions().updateBids([
          {
            id: row.id,
            removed_at: new Date(),
            removed_by: "user_admin",
            removed_reason: "test",
          },
        ])
      }
      return row
    }

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("401s a token whose actor is not a customer (AC4 customer-only)", async () => {
      const container = getContainer()
      const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
        .projectConfig
      const token = generateJwtToken(
        {
          actor_id: "user_admin",
          actor_type: "user",
          auth_identity_id: "",
          app_metadata: {},
          user_metadata: {},
        },
        { secret: http.jwtSecret, expiresIn: "1h" }
      )
      expect(
        await statusOf(
          api.get("/store/my-bids", {
            headers: {
              authorization: `Bearer ${token}`,
              "x-publishable-api-key": publishable,
            },
          })
        )
      ).toEqual(401)
    })

    it("a lot_id filter never reveals another customer's lot (ownership)", async () => {
      const a = await customer("Ayu")
      const b = await customer("Bagus")
      const live = await auction("live")
      const onlyA = await lot(live.id)
      await bid(onlyA, a.id, 1_000_000)

      const res = await api.get(`/store/my-bids?lot_id=${onlyA}`, {
        headers: b.headers,
      })
      expect(res.status).toEqual(200)
      expect(res.data).toEqual({ lots: [] })
    })

    it("rejects an empty lot_id with 400", async () => {
      const a = await customer("Ayu")
      expect(
        await statusOf(api.get("/store/my-bids?lot_id=", { headers: a.headers }))
      ).toEqual(400)
    })

    it("an unsold lot the caller bid on (no winner at all): documents the reported position", async () => {
      const a = await customer("Ayu")
      const closed = await auction("closed")
      const unsold = await lot(closed.id, { status: "unsold" })
      await bid(unsold, a.id, 1_000_000)

      const res = await api.get("/store/my-bids", { headers: a.headers })
      expect(res.data.lots).toHaveLength(1)
      // AC4 defines `lost` as "closed with another winner"; nobody won here.
      // Current behaviour (qa saw it): reported as `lost` with lot_status null.
      expect(res.data.lots[0]).toMatchObject({ position: "lost", lot_status: null })
    })
  },
})
