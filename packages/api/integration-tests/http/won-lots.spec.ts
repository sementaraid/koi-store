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
import { PII_AUDIT_MODULE } from "../../src/modules/pii-audit"
import type PiiAuditModuleService from "../../src/modules/pii-audit/service"
import { confirmLotPaymentWorkflow } from "../../src/workflows/confirm-lot-payment"

jest.setTimeout(120 * 1000)

// US-051 T-051.6 / US-053 T-053.2 / US-108 (D-046, D-052, D-056, D-068): the
// winner's own won-and-later lots, read only. Another customer's lot is absent and 404 by
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
// The farmer's payout account: none of it, masked or full, may reach the
// winner (US-108 AC2, D-068). Distinct strings, so an id can't match them.
const HOLDER = "Budi Santoso"
const BANK = "Bank Uji Peternak"
const ACCOUNT = "1234567890"

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
    // never reach the winner; US-051 T-051.1a: the payout account only masked).
    // `withBank: false` leaves the farm without a payment_details row.
    const seller = async (withBank = true) => {
      const sellerModule = getContainer().resolve<{
        createSellers: (
          data: Record<string, unknown>[]
        ) => Promise<{ id: string; name: string }[]>
        createPaymentDetails: (
          data: Record<string, unknown>[]
        ) => Promise<unknown>
      }>(MercurModules.SELLER)
      const [row] = await sellerModule.createSellers([
        {
          name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
          phone: SELLER_PHONE,
          currency_code: "idr",
        },
      ])
      if (withBank) {
        await sellerModule.createPaymentDetails([
          {
            seller_id: row.id,
            holder_name: HOLDER,
            bank_name: BANK,
            account_number: ACCOUNT,
          },
        ])
      }
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
          shipped_at:
            status === "shipped" || status === "delivered"
              ? new Date(Date.now() - 120_000)
              : null,
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
        // D-072: nothing paid yet.
        paid_at: null,
        // US-051 T-051.1a (D-058).
        pay_by: expect.any(String),
        tracking_number: "JNE12345",
        // D-072: shipped, so the ship date is saved; not delivered yet.
        shipped_at: expect.any(String),
        delivered_at: null,
        auction: { id: expect.any(String), delivery_method: "courier" },
        product: { title: null, thumbnail: null },
        // US-108 AC2 (D-068): no farmer bank field, masked or full.
        seller: { id: farm.id, name: farm.name },
        // US-054 T-054.1b: shipped, so no window and no claim yet.
        claim_window_ends_at: null,
        claim: null,
        // US-057 T-057.1: no rating yet.
        rating: null,
        // US-109 T-109.1: no proof uploaded yet, and never a key or URL.
        proof: {
          status: "none",
          has_image: false,
          reason: null,
          uploaded_at: null,
        },
        // US-110 T-110.1: no arrival proof yet, and never a key or URL.
        arrival_proof: { has_file: false, uploaded_at: null },
      })
      expect(new Date(shipped.pay_by).getTime()).toEqual(
        new Date(shipped.closed_at).getTime() + DAY
      )
    })

    it("pay_by is closed_at + 24 h, and null when the lot has no closed_at", async () => {
      const farm = await seller()
      const winner = await customer()
      const closed = await lot("won", winner.id, 90, farm.id)
      const noClosedAt = await lot("won", winner.id, 0, farm.id)
      await auctions().updateLots([{ id: noClosedAt, closed_at: null }])

      const res = await api.get("/store/won-lots", { headers: winner.headers })
      const rows = res.data.lots as {
        id: string
        pay_by: string | null
        closed_at: string | null
      }[]
      const byId = new Map(rows.map((l) => [l.id, l]))
      const row = byId.get(closed)!
      expect(new Date(row.pay_by!).getTime()).toEqual(
        new Date(row.closed_at!).getTime() + DAY
      )
      expect(byId.get(noClosedAt)!.pay_by).toBeNull()
      expect(byId.get(noClosedAt)!.closed_at).toBeNull()
    })

    it("returns paid_at: null before the admin confirms the payment, the ISO date after (D-072)", async () => {
      const farm = await seller()
      const winner = await customer()
      const lotId = await lot("won", winner.id, 30, farm.id)

      const before = await api.get("/store/won-lots", { headers: winner.headers })
      expect(before.data.lots[0].paid_at).toBeNull()

      await confirmLotPaymentWorkflow(getContainer()).run({
        input: { lot_id: lotId, admin_id: "user_admin" },
      })

      const list = await api.get("/store/won-lots", { headers: winner.headers })
      const detail = await api.get(`/store/won-lots/${lotId}`, {
        headers: winner.headers,
      })
      const paidAt = list.data.lots[0].paid_at
      expect(typeof paidAt).toEqual("string")
      expect(new Date(paidAt).toISOString()).toEqual(paidAt)
      expect(detail.data.lot.status).toEqual("paid")
      expect(detail.data.lot.paid_at).toEqual(paidAt)
    })

    it("returns paid_at: null for a lot marked paid before US-108, never a guessed date (AC4, D-072)", async () => {
      const farm = await seller()
      const winner = await customer()
      // `paid` status from before US-108 saved a date: no paid_at column value.
      const lotId = await lot("paid", winner.id, 30, farm.id)

      const list = await api.get("/store/won-lots", { headers: winner.headers })
      const detail = await api.get(`/store/won-lots/${lotId}`, {
        headers: winner.headers,
      })
      const expected = {
        id: lotId,
        status: "paid",
        closed_at: expect.any(String),
        paid_at: null,
        shipped_at: null,
        delivered_at: null,
      }
      expect(list.data.lots[0]).toMatchObject(expected)
      expect(detail.data.lot).toMatchObject(expected)
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
        closed_at: expect.any(String),
        paid_at: null,
        shipped_at: expect.any(String),
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
      const byId = await api.get(`/store/won-lots/${lotId}`, {
        headers: winner.headers,
      })
      // US-108 AC2 (D-068): no farmer bank field on the list or by id, masked
      // or full.
      for (const forbidden of [
        "phone",
        "payment_details",
        "bank_name",
        "holder_name",
        "account_number",
        ACCOUNT,
        HOLDER,
        BANK,
        "address_1",
        "winner_customer_id",
        winner.id,
        WINNER_PHONE,
        SELLER_PHONE,
        STREET,
      ]) {
        expect(JSON.stringify(res.data)).not.toContain(forbidden)
        expect(JSON.stringify(byId.data)).not.toContain(forbidden)
      }
      // The farm name only; no other seller field.
      expect(res.data.lots[0].seller).toEqual({ id: farm.id, name: farm.name })
      expect(byId.data.lot.seller).toEqual({ id: farm.id, name: farm.name })
    })

    // US-108 AC2 (D-068): the winner's farmer-bank reveal is gone. The route
    // no longer exists, so it is 404 and writes no audit row.
    it("has no bank account reveal: 404 and no audit row", async () => {
      const farm = await seller()
      const winner = await customer()
      const lotId = await lot("won", winner.id, 0, farm.id)

      expect(
        await statusOf(
          api.post(
            `/store/won-lots/${lotId}/reveal`,
            { field: "bank_account" },
            { headers: winner.headers }
          )
        )
      ).toEqual(404)
      expect(
        await getContainer()
          .resolve<PiiAuditModuleService>(PII_AUDIT_MODULE)
          .listPiiRevealAudits({ record_id: lotId })
      ).toHaveLength(0)
    })
  },
})
