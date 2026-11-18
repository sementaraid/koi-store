import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { createFarmerRatingStep } from "../../src/workflows/steps/farmer-rating"

jest.setTimeout(120 * 1000)

// US-057 T-057.1 AC1 (mvp-Q48, D-042/D-045, D-055, D-058): the lot's winner
// rates the farmer once, from `shipped` on (`shipped`/`delivered`/`claimed`).
// Another customer is 404; every rule is a 409/400 and writes no row. The
// response carries no rater id, phone, email, NIK or address. No money moves.

const WINNER_PHONE = "+6281111222333"
const WINNER_EMAIL_DOMAIN = "rater-secret.test"
const STREET = "Jl. Rahasia Rating 9"

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

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

// The real insert, then a failure, so its compensation runs.
const failAfterRatingStep = createStep("qa-fail-after-rating", async () => {
  throw new Error("qa: simulated failure after createFarmerRatingStep")
})
const ratingThenFailWorkflow = createWorkflow(
  "create-rating-then-fail-test",
  function (input: {
    lot_id: string
    customer_id: string
    seller_id: string
    stars: number
    comment: string | null
  }) {
    createFarmerRatingStep(input)
    failAfterRatingStep()
  }
)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallet = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `rater-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}@${WINNER_EMAIL_DOMAIN}`,
          phone: WINNER_PHONE,
          addresses: [
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
          ],
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
    // The shipped/paid routes are parked, so the spec seeds through the
    // module service (same shape as won-lot-claims.spec.ts).
    const wonLot = async (
      status: LotStatus,
      winnerId: string,
      sellerId = "sel_rating"
    ) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: sellerId,
          fee_category_id: "feecat_rating",
          start_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          end_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
          product_id: "prod_rating_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status,
          winner_customer_id: winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at:
            status === "delivered" || status === "claimed" ? new Date() : null,
        },
      ])
      return row.id
    }

    const rate = (
      headers: Record<string, string>,
      lotId: string,
      body: Record<string, unknown>
    ) => api.post(`/store/won-lots/${lotId}/rating`, body, { headers })

    const rowsFor = (lotId: string) =>
      moderation().listFarmerRatings({ lot_id: lotId })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "test", type: "publishable", created_by: "test" },
        ])
      publishable = key.token
    })

    it("stores one rating on a shipped lot and returns the trimmed comment (AC1)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)
      const before = Date.now()
      const ledgerBefore = await wallet().listWalletTransactions({})

      const res = await rate(winner.headers, lotId, {
        stars: 5,
        comment: "  Ikan sehat, pengiriman cepat.  ",
      })
      expect(res.status).toEqual(201)
      expect(res.data.rating).toEqual({
        id: expect.stringMatching(/^frat_/),
        lot_id: lotId,
        stars: 5,
        comment: "Ikan sehat, pengiriman cepat.",
        created_at: expect.any(String),
      })
      expect(new Date(res.data.rating.created_at).getTime()).toBeGreaterThanOrEqual(
        before - 1000
      )

      const rows = await rowsFor(lotId)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        lot_id: lotId,
        customer_id: winner.id,
        seller_id: "sel_rating",
        stars: 5,
        comment: "Ikan sehat, pengiriman cepat.",
      })
      // D-058: a rating moves no money and writes no ledger row.
      expect(await wallet().listWalletTransactions({})).toHaveLength(
        ledgerBefore.length
      )
    })

    it("accepts no comment and saves null (mvp-Q48)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      const res = await rate(winner.headers, lotId, { stars: 4 })
      expect(res.status).toEqual(201)
      expect(res.data.rating.comment).toBeNull()
      expect((await rowsFor(lotId))[0].comment).toBeNull()
    })

    it("allows delivered and claimed lots (the pinned window)", async () => {
      const winner = await customer()
      for (const status of ["delivered", "claimed"] as const) {
        const lotId = await wonLot(status, winner.id)
        const res = await rate(winner.headers, lotId, { stars: 3 })
        expect(res.status).toEqual(201)
        expect(await rowsFor(lotId)).toHaveLength(1)
      }
    })

    it("refuses every status before shipped with 409 and writes no row", async () => {
      const winner = await customer()
      for (const status of [
        "open",
        "unsold",
        "won",
        "paid",
        "cancelled",
      ] as const) {
        const lotId = await wonLot(status, winner.id)
        expect(
          await statusOf(rate(winner.headers, lotId, { stars: 5 }))
        ).toEqual(409)
        expect(await rowsFor(lotId)).toHaveLength(0)
      }
    })

    it("404s another customer and an unknown lot, and 401s anonymous (AC1)", async () => {
      const winner = await customer()
      const other = await customer()
      const lotId = await wonLot("shipped", winner.id)

      expect(
        await statusOf(rate(other.headers, lotId, { stars: 5 }))
      ).toEqual(404)
      expect(
        await statusOf(rate(winner.headers, "lot_does_not_exist", { stars: 5 }))
      ).toEqual(404)
      expect(
        await statusOf(
          rate(
            { "x-publishable-api-key": publishable },
            lotId,
            { stars: 5 }
          )
        )
      ).toEqual(401)
      expect(await rowsFor(lotId)).toHaveLength(0)
    })

    it("refuses a second rating with 409 and keeps one row (AC1 once per lot)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      expect((await rate(winner.headers, lotId, { stars: 5 })).status).toEqual(
        201
      )
      expect(
        await statusOf(rate(winner.headers, lotId, { stars: 1, comment: "lagi" }))
      ).toEqual(409)
      expect(await rowsFor(lotId)).toHaveLength(1)
    })

    it("rejects a bad body with 400 and writes no row", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)
      const attempt = (body: Record<string, unknown>) =>
        statusOf(rate(winner.headers, lotId, body))

      expect(await attempt({ stars: 0 })).toEqual(400)
      expect(await attempt({ stars: 6 })).toEqual(400)
      expect(await attempt({ stars: 2.5 })).toEqual(400)
      expect(await attempt({ comment: "tanpa bintang" })).toEqual(400)
      expect(await attempt({ stars: 5, comment: "x".repeat(301) })).toEqual(400)
      // Strict: an unknown key is refused.
      expect(await attempt({ stars: 5, seller_id: "sel_other" })).toEqual(400)

      expect(await rowsFor(lotId)).toHaveLength(0)
    })

    it("accepts exactly 300 characters of comment (the boundary)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)
      const res = await rate(winner.headers, lotId, {
        stars: 5,
        comment: "x".repeat(300),
      })
      expect(res.status).toEqual(201)
      expect((await rowsFor(lotId))[0].comment).toHaveLength(300)
    })

    it("carries rating on the won-lot rows and null on a lot without one (AC1)", async () => {
      const winner = await customer()
      const rated = await wonLot("shipped", winner.id)
      const unrated = await wonLot("shipped", winner.id)

      const posted = await rate(winner.headers, rated, { stars: 4, comment: "ok" })
      expect(posted.status).toEqual(201)
      const expected = {
        id: posted.data.rating.id,
        stars: 4,
        comment: "ok",
        created_at: posted.data.rating.created_at,
      }

      const list = await api.get("/store/won-lots", { headers: winner.headers })
      expect(list.status).toEqual(200)
      const byId = new Map<string, { rating: unknown }>(
        (list.data.lots as { id: string; rating: unknown }[]).map((l) => [
          l.id,
          l,
        ])
      )
      expect(byId.get(rated)!.rating).toEqual(expected)
      expect(byId.get(unrated)!.rating).toBeNull()

      const one = await api.get(`/store/won-lots/${rated}`, {
        headers: winner.headers,
      })
      expect(one.data.lot.rating).toEqual(expected)
    })

    it("deletes the rating when a later step fails (compensation)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      const run = await ratingThenFailWorkflow(getContainer()).run({
        input: {
          lot_id: lotId,
          customer_id: winner.id,
          seller_id: "sel_rating",
          stars: 5,
          comment: null,
        },
        throwOnError: false,
      })
      expect(run.errors?.length).toBeGreaterThan(0)
      expect(await rowsFor(lotId)).toHaveLength(0)
    })

    // US-057 T-057.1b AC2: the public farm-page aggregate. Read only, publishable
    // key only; a non-`open` seller is 404 like `GET /store/sellers`.
    const sellerModule = () =>
      getContainer().resolve<{
        createSellers: (data: Record<string, unknown>[]) => Promise<
          { id: string; name: string }[]
        >
        updateSellers: (data: Record<string, unknown>) => Promise<unknown>
      }>(MercurModules.SELLER)

    const makeSeller = async (status: "open" | "suspended") => {
      const [row] = await sellerModule().createSellers([
        {
          name: `Kebun Rating ${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          email: `farm-rating-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}@test.dev`,
          currency_code: "idr",
        },
      ])
      await sellerModule().updateSellers({ id: row.id, status })
      return row
    }

    const rater = async (first_name: string, last_name: string) => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `rater-name-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}@${WINNER_EMAIL_DOMAIN}`,
            first_name,
            last_name,
            phone: WINNER_PHONE,
          },
        ])
      return row
    }

    // Direct insert: the aggregate wants several rows with a known order.
    const seedRating = async (input: {
      seller_id: string
      customer_id: string
      stars: number
      comment?: string | null
      created_at?: Date
    }) => {
      const [row] = await moderation().createFarmerRatings([
        {
          lot_id: `lot_${Math.random().toString(36).slice(2, 12)}`,
          comment: null,
          ...input,
        },
      ])
      return row
    }

    const getRatings = (query: string) =>
      api.get(`/store/ratings?${query}`, {
        headers: { "x-publishable-api-key": publishable },
      })

    it("aggregates a seller's ratings: average one decimal, count, newest first (AC2)", async () => {
      const seller = await makeSeller("open")
      const other = await makeSeller("open")
      const budi = await rater("Budi", "Santoso")
      const sari = await rater("Sari", "Dewi")
      const agus = await rater("Agus", "Pratama")

      await seedRating({
        seller_id: seller.id,
        customer_id: budi.id,
        stars: 4,
        comment: "Ikan sehat.",
        created_at: new Date("2026-01-01T00:00:00Z"),
      })
      await seedRating({
        seller_id: seller.id,
        customer_id: sari.id,
        stars: 5,
        created_at: new Date("2026-01-02T00:00:00Z"),
      })
      await seedRating({
        seller_id: seller.id,
        customer_id: agus.id,
        stars: 4,
        created_at: new Date("2026-01-03T00:00:00Z"),
      })
      await seedRating({
        seller_id: other.id,
        customer_id: budi.id,
        stars: 1,
        created_at: new Date("2026-01-04T00:00:00Z"),
      })

      const res = await getRatings(`seller_id=${seller.id}`)
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(3)
      // (4 + 5 + 4) / 3 = 4.333… → 4.3, a number.
      expect(res.data.average).toEqual(4.3)
      expect(typeof res.data.average).toEqual("number")
      expect(res.data.limit).toEqual(10)
      expect(res.data.offset).toEqual(0)

      // Newest first, and the other seller's rating is absent.
      expect(res.data.ratings.map((r: { stars: number }) => r.stars)).toEqual([
        4, 5, 4,
      ])
      expect(res.data.ratings[0].rater.name).toEqual("Agus")
      expect(res.data.ratings[1].rater.name).toEqual("Sari")
      expect(res.data.ratings[2].rater.name).toEqual("Budi")
      expect(JSON.stringify(res.data)).not.toContain(other.id)
    })

    it("returns a null average and an empty list for a farm with no ratings (AC2)", async () => {
      const seller = await makeSeller("open")

      const res = await getRatings(`seller_id=${seller.id}`)
      expect(res.status).toEqual(200)
      expect(res.data).toEqual({
        average: null,
        count: 0,
        ratings: [],
        limit: 10,
        offset: 0,
      })
    })

    it("pages with limit and offset (AC2)", async () => {
      const seller = await makeSeller("open")
      const budi = await rater("Budi", "Santoso")
      for (const [i, stars] of [3, 4, 5].entries()) {
        await seedRating({
          seller_id: seller.id,
          customer_id: budi.id,
          stars,
          created_at: new Date(`2026-02-0${i + 1}T00:00:00Z`),
        })
      }

      const page = await getRatings(`seller_id=${seller.id}&limit=1&offset=1`)
      expect(page.status).toEqual(200)
      expect(page.data.limit).toEqual(1)
      expect(page.data.offset).toEqual(1)
      // The average and count cover every rating, not just the page.
      expect(page.data.count).toEqual(3)
      expect(page.data.average).toEqual(4)
      expect(page.data.ratings).toHaveLength(1)
      expect(page.data.ratings[0].stars).toEqual(4)
    })

    it("404s an unknown or non-open seller with the Indonesian message (AC2)", async () => {
      const suspended = await makeSeller("suspended")

      for (const id of ["sel_does_not_exist", suspended.id]) {
        const refused = await getRatings(`seller_id=${id}`).catch(
          (e: { response: { status: number; data: { message?: string } } }) =>
            e.response
        )
        expect(refused.status).toEqual(404)
        expect(refused.data.message).toEqual("Mitra tidak ditemukan.")
      }
    })

    it("400s a bad limit and a bad page (AC2)", async () => {
      const seller = await makeSeller("open")

      expect(await statusOf(getRatings(`seller_id=${seller.id}&limit=0`))).toEqual(400)
      expect(await statusOf(getRatings(`seller_id=${seller.id}&limit=51`))).toEqual(400)
      expect(await statusOf(getRatings(`seller_id=${seller.id}&offset=-1`))).toEqual(400)
      expect(await statusOf(getRatings("limit=5"))).toEqual(400)
    })

    it("shows the rater's first name only and leaks no PII (D-042/D-045)", async () => {
      const seller = await makeSeller("open")
      const budi = await rater("Budi", "Santoso")
      await seedRating({
        seller_id: seller.id,
        customer_id: budi.id,
        stars: 5,
        comment: "Mantap.",
      })

      const res = await getRatings(`seller_id=${seller.id}`)
      expect(res.status).toEqual(200)
      expect(res.data.ratings[0].rater).toEqual({ name: "Budi" })

      const json = JSON.stringify(res.data)
      expect(json).not.toContain("Santoso")
      expect(json).not.toContain(budi.id)
      expect(json).not.toContain(WINNER_PHONE)
      expect(json).not.toContain(WINNER_EMAIL_DOMAIN)
      expect(json).not.toContain("customer_id")
      expect(json).not.toContain("nik")
    })

    it("leaks no rater id, phone, email, NIK or address (D-042/D-045)", async () => {
      const winner = await customer()
      const lotId = await wonLot("shipped", winner.id)

      const posted = await rate(winner.headers, lotId, { stars: 5 })
      expect(posted.status).toEqual(201)
      const list = await api.get("/store/won-lots", { headers: winner.headers })

      for (const payload of [posted.data, list.data]) {
        const json = JSON.stringify(payload)
        expect(json).not.toContain(winner.id)
        expect(json).not.toContain(WINNER_PHONE)
        expect(json).not.toContain(WINNER_EMAIL_DOMAIN)
        expect(json).not.toContain(STREET)
        expect(json).not.toContain("nik")
        expect(json).not.toContain("customer_id")
      }
    })
  },
})
