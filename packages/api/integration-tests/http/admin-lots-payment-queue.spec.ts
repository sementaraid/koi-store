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

// US-108 T-108.3a / T-108.7 (AC5, AC7, D-002, D-042, D-068, D-079): the
// admin-koi "Pembayaran pemenang" queue. Defaults to `won`, oldest deadline
// first; `overdue=true` keeps lots past `closed_at + 24 h`; the winner's name
// is masked and `winner_customer_id` carries the opaque id the strike call
// needs. Admin token only.

const DAY = 24 * 60 * 60 * 1000
const OB = 1_000_000
const FINAL = 1_500_000

type HttpResponse = {
  status: number
  data: {
    message?: string
    lots?: Record<string, unknown>[]
    count?: number
    limit?: number
    offset?: number
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

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let farm: { id: string; name: string }
    let productId: string
    let winner: { id: string; name: string }

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    // One lot in its own closed auction. `closedOffsetMin` orders the list and
    // decides `overdue` (deadline is +24 h).
    const lot = async (
      status: LotStatus,
      closedOffsetMin: number
    ): Promise<string> => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: farm.id,
          fee_category_id: "feecat_lots_queue",
          start_at: new Date(Date.now() - 3 * DAY),
          end_at: new Date(Date.now() - DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed" as never,
        },
      ])
      const closedAt =
        status === "open"
          ? null
          : new Date(Date.now() - closedOffsetMin * 60_000)
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: productId,
          ob: OB,
          kb: 50_000,
          current_price: FINAL,
          end_time: new Date(Date.now() - DAY),
          status,
          winner_customer_id: status === "open" ? null : winner.id,
          final_price: status === "open" ? null : FINAL,
          closed_at: closedAt,
        },
      ])
      return row.id
    }

    const list = (query = "", headers: Record<string, string> = admin) =>
      api.get(`/admin/lots${query}`, { headers })

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([
          {
            email: `lots-admin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
          },
        ])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }

      const [seller] = await container
        .resolve<{
          createSellers: (
            data: Record<string, unknown>[]
          ) => Promise<{ id: string; name: string }[]>
        }>(MercurModules.SELLER)
        .createSellers([
          {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email: `farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
            currency_code: "idr",
          },
        ])
      farm = seller

      const [koi] = await container.resolve(Modules.PRODUCT).createProducts([
        {
          title: `Kohaku ${Date.now()}`,
          description: "Maruten bersih.",
          status: "draft" as never,
        },
      ])
      productId = koi.id

      const [buyer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `winner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`,
          first_name: "Budi",
          last_name: "Santoso",
        },
      ])
      winner = { id: buyer.id, name: "Budi Santoso" }
    })

    it("lists won lots oldest deadline first with masked winner and its id (AC5, AC7, D-042)", async () => {
      const overdue = await lot("won", 2 * 24 * 60)
      const recent = await lot("won", 60)
      await lot("paid", 30)
      await lot("open", 0)

      const res = await list()
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(2)
      expect(res.data.limit).toEqual(20)
      expect(res.data.offset).toEqual(0)
      expect(res.data.lots!.map((row) => row.id)).toEqual([overdue, recent])

      const first = res.data.lots![0]
      expect(first).toEqual({
        id: overdue,
        lot_number: 1,
        title: expect.stringContaining("Kohaku"),
        seller: { name: farm.name },
        winner: { name: "B*** S******" },
        // US-108 AC7: the id the strike call uses; no full name or other PII.
        winner_customer_id: winner.id,
        final_price: FINAL,
        closed_at: expect.any(String),
        pay_by: expect.any(String),
        overdue: true,
        // US-109 T-109.1: no proof yet; never a key or URL.
        proof: {
          status: "none",
          has_image: false,
          reason: null,
          uploaded_at: null,
        },
      })
      expect(new Date(first.pay_by as string).getTime()).toEqual(
        new Date(first.closed_at as string).getTime() + DAY
      )
      expect(res.data.lots![1].overdue).toEqual(false)

      // No full name or other PII anywhere in the body. The only winner id is
      // the explicit `winner_customer_id` (AC7).
      const body = JSON.stringify(res.data)
      expect(body).not.toContain("Budi Santoso")
      expect(body).not.toMatch(/@test\.dev/)
    })

    // D-079: the admin raises the non-payment from this queue. The strike call
    // takes the row's lot id (the server resolves the winner) while the row's
    // `winner_customer_id` feeds the history read.
    it("gives an overdue winner a strike from the queue row (AC7, D-079)", async () => {
      const overdue = await lot("won", 2 * 24 * 60)
      const queue = await list("?overdue=true")
      const row = queue.data.lots!.find((item) => item.id === overdue)!
      expect(row.winner_customer_id).toEqual(winner.id)

      const res = await api.post(
        "/admin/strikes",
        {
          lot_id: row.id,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar dalam 1×24 jam.",
        },
        { headers: admin }
      )
      expect(res.status).toEqual(201)
      expect(res.data.strike).toMatchObject({
        customer_id: winner.id,
        lot_id: overdue,
        reason_type: "winner_unpaid",
        reason: "Pemenang tidak membayar dalam 1×24 jam.",
      })

      const history = await api.get(
        `/admin/strikes?customer_id=${row.winner_customer_id}`,
        { headers: admin }
      )
      expect(history.status).toEqual(200)
      expect(history.data.count).toEqual(1)
      expect(history.data.strikes[0].lot_id).toEqual(overdue)
    })

    it("filters overdue only, and treats overdue=false as no filter (AC5)", async () => {
      const overdue = await lot("won", 2 * 24 * 60)
      const recent = await lot("won", 60)

      const onlyOverdue = await list("?overdue=true")
      expect(onlyOverdue.status).toEqual(200)
      expect(onlyOverdue.data.count).toEqual(1)
      expect(onlyOverdue.data.lots!.map((row) => row.id)).toEqual([overdue])
      expect(onlyOverdue.data.lots![0].overdue).toEqual(true)

      const all = await list("?overdue=false")
      expect(all.data.count).toEqual(2)
      expect(all.data.lots!.map((row) => row.id)).toEqual([overdue, recent])
    })

    it("filters by status (AC5)", async () => {
      const won = await lot("won", 60)
      const paid = await lot("paid", 30)

      const res = await list("?status=paid")
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(1)
      expect(res.data.lots!.map((row) => row.id)).toEqual([paid])

      const defaulted = await list()
      expect(defaulted.data.lots!.map((row) => row.id)).toEqual([won])
    })

    it("paginates like the other admin lists (AC5)", async () => {
      const first = await lot("won", 3000)
      const second = await lot("won", 2000)
      const third = await lot("won", 1000)

      const res = await list("?limit=2&offset=1")
      expect(res.status).toEqual(200)
      expect(res.data.count).toEqual(3)
      expect(res.data.limit).toEqual(2)
      expect(res.data.offset).toEqual(1)
      expect(res.data.lots!.map((row) => row.id)).toEqual([second, third])
      expect(res.data.lots!.map((row) => row.id)).not.toContain(first)
    })

    it("401s no token, a customer token and a member token (D-002)", async () => {
      await lot("won", 60)
      const container = getContainer()
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          { email: `lots-other-${Date.now()}@test.dev` },
        ])

      for (const headers of [
        {} as Record<string, string>,
        { authorization: `Bearer ${jwt(container, customer.id, "customer")}` },
        { authorization: `Bearer ${jwt(container, "mem_lots", "member")}` },
      ]) {
        expect((await failure(list("", headers))).status).toEqual(401)
      }
    })

    it("400s an unknown status (AC5)", async () => {
      expect((await failure(list("?status=unknown"))).status).toEqual(400)
    })
  },
})
