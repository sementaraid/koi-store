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
import { closeLotWorkflow } from "../../src/workflows/close-lot"
import { setLotFieldsStep } from "../../src/workflows/steps/lot"

jest.setTimeout(120 * 1000)

// US-091 T-091.1a (AC1, D-035, D-050, D-055): the admin cancels an `open` lot
// with a written reason. `open → cancelled`, the reason saved, no winner, no
// bid touched, end_time untouched; every other status is a 409.

const DAY = 24 * 60 * 60 * 1000
const OB = 100_000
const KB = 50_000

type HttpResponse = {
  status: number
  data: {
    code?: string
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
  actor_type: "customer" | "user"
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
const failAfterCancelStep = createStep("qa-fail-after-cancel", async () => {
  throw new Error("qa: simulated failure after the lot write")
})
const writeThenFailWorkflow = createWorkflow(
  "cancel-lot-then-fail-test",
  function (input: { lot_id: string; reason: string }) {
    setLotFieldsStep({
      id: input.lot_id,
      update: { status: "cancelled", cancel_reason: input.reason },
    })
    failAfterCancelStep()
  }
)

type StoredLot = {
  id: string
  status: string
  cancel_reason: string | null
  winner_customer_id: string | null
  final_price: number | null
  current_price: number
  end_time: Date | string
  auction_id: string
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let storeHeaders: Record<string, string>

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const customer = async () => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `cancel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
          },
        ])
      return row.id as string
    }

    const auction = async (status = "live") => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_cancel",
          fee_category_id: "feecat_cancel",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: status as never,
          payer_customer_id: "cus_farmer",
        },
      ])
      return row
    }

    const lot = async (
      auctionId: string,
      overrides: {
        status?: string
        current_price?: number
        winner_customer_id?: string | null
        final_price?: number | null
      } = {}
    ) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_cancel",
          ob: OB,
          kb: KB,
          current_price: overrides.current_price ?? OB,
          end_time: new Date(Date.now() + DAY),
          status: (overrides.status ?? "open") as never,
          winner_customer_id: overrides.winner_customer_id ?? null,
          final_price: overrides.final_price ?? null,
        },
      ])
      return row
    }

    const seedBids = async (
      lotId: string,
      entries: { customer_id: string; amount: number }[]
    ) => {
      const rows: { id: string }[] = []
      for (const entry of entries) {
        const [row] = await auctions().createBids([
          {
            lot_id: lotId,
            customer_id: entry.customer_id,
            amount: entry.amount,
            source: "web",
          },
        ])
        rows.push(row)
      }
      return rows
    }

    // A live auction, an open lot, and bids 100/150 with the price at 150.
    const ready = async () => {
      const [first, second] = await Promise.all([customer(), customer()])
      const event = await auction()
      const seeded = await lot(event.id)
      const bids = await seedBids(seeded.id, [
        { customer_id: first, amount: 100_000 },
        { customer_id: second, amount: 150_000 },
      ])
      await auctions().updateLots([{ id: seeded.id, current_price: 150_000 }])
      return { event, lot: seeded, bids, first, second }
    }

    const cancel = (
      lotId: string,
      body: unknown = { reason: "Ikan sakit." },
      headers: Record<string, string> = admin
    ) => api.post(`/admin/lots/${lotId}/cancel`, body, { headers })

    const lotById = async (id: string) => {
      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "lot",
          fields: [
            "id",
            "status",
            "cancel_reason",
            "winner_customer_id",
            "final_price",
            "current_price",
            "end_time",
            "auction_id",
          ],
          filters: { id },
        })
      return row as StoredLot
    }

    const bidCount = async (lotId: string) => {
      const { data } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "bid",
          fields: ["id"],
          filters: { lot_id: lotId },
        })
      return data.length
    }

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `cancel-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${jwt(container, user.id, "user")}` }
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "test", type: "publishable", created_by: "test" },
        ])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    it("cancels an open lot of a live auction: reason saved, no winner, bids kept (AC1)", async () => {
      const { event, lot: seeded, bids } = await ready()
      const before = new Date((await lotById(seeded.id)).end_time).getTime()

      const res = await cancel(seeded.id)
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: seeded.id,
        status: "cancelled",
        cancel_reason: "Ikan sakit.",
        auction_id: event.id,
      })

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("cancelled")
      expect(stored.cancel_reason).toEqual("Ikan sakit.")
      expect(stored.winner_customer_id).toBeNull()
      expect(stored.final_price).toBeNull()
      // end_time never written.
      expect(new Date(stored.end_time).getTime()).toEqual(before)
      // The bid rows are kept, untouched.
      expect(await bidCount(seeded.id)).toEqual(bids.length)
    })

    it("leaves a cancelled lot alone on a later close-job pass (AC1, D-036)", async () => {
      const { lot: seeded, bids } = await ready()
      expect((await cancel(seeded.id)).status).toEqual(200)

      const { result } = await closeLotWorkflow(getContainer()).run({
        input: { lot_id: seeded.id },
      })
      expect(result).toEqual({ closed: false, status: null })

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("cancelled")
      expect(stored.cancel_reason).toEqual("Ikan sakit.")
      expect(stored.winner_customer_id).toBeNull()
      expect(stored.final_price).toBeNull()
      expect(await bidCount(seeded.id)).toEqual(bids.length)
    })

    it("allows an open lot of a scheduled auction (AC1, the guard is the lot status only)", async () => {
      const event = await auction("scheduled")
      const seeded = await lot(event.id)

      const res = await cancel(seeded.id)
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: seeded.id,
        status: "cancelled",
        auction_id: event.id,
      })
    })

    it("409s every status but open and writes nothing (AC1, D-035)", async () => {
      const event = await auction()
      for (const status of [
        "won",
        "paid",
        "shipped",
        "delivered",
        "claimed",
        "unsold",
        "cancelled",
      ] as const) {
        const seeded = await lot(event.id, {
          status,
          winner_customer_id: "cus_winner",
          final_price: 150_000,
        })
        const res = await failure(cancel(seeded.id))
        expect(res.status).toEqual(409)
        // Medusa's handler replaces a CONFLICT code and message with its own
        // (stock behaviour, same as the claim and bid guards), so HTTP carries
        // `invalid_state_error`; the step's `lot_not_cancellable` is internal.

        const stored = await lotById(seeded.id)
        expect(stored.status).toEqual(status)
        expect(stored.cancel_reason).toBeNull()
      }
    })

    it("404s an unknown lot and 400s a blank or absent reason (AC1, D-055)", async () => {
      const { lot: seeded } = await ready()

      expect((await failure(cancel("lot_does_not_exist"))).status).toEqual(404)
      for (const body of [{}, { reason: "" }, { reason: "   " }]) {
        const res = await failure(cancel(seeded.id, body))
        expect(res.status).toEqual(400)
        expect(res.data.message).toContain("Alasan pembatalan wajib diisi.")
      }
      expect((await lotById(seeded.id)).status).toEqual("open")
    })

    it("401s an anonymous caller and a customer token (D-002)", async () => {
      const { lot: seeded, first } = await ready()
      const customerHeader = {
        authorization: `Bearer ${jwt(getContainer(), first, "customer")}`,
      }

      expect(
        (await failure(cancel(seeded.id, undefined, {}))).status
      ).toEqual(401)
      expect(
        (await failure(cancel(seeded.id, undefined, customerHeader))).status
      ).toEqual(401)
      expect((await lotById(seeded.id)).status).toEqual("open")
    })

    it("restores status and cancel_reason when a later step fails", async () => {
      const { lot: seeded } = await ready()

      await expect(
        writeThenFailWorkflow(getContainer()).run({
          input: { lot_id: seeded.id, reason: "Ikan sakit." },
        })
      ).rejects.toBeTruthy()

      const stored = await lotById(seeded.id)
      expect(stored.status).toEqual("open")
      expect(stored.cancel_reason).toBeNull()
    })

    it("the store lot detail then shows it cancelled with null price and no bids (D-050)", async () => {
      const { lot: seeded } = await ready()
      expect((await cancel(seeded.id)).status).toEqual(200)

      const res = await api.get(`/store/lots/${seeded.id}`, {
        headers: storeHeaders,
      })
      expect(res.status).toEqual(200)
      expect(res.data.lot).toMatchObject({
        id: seeded.id,
        cancelled: true,
        current_price: null,
        final_price: null,
        sold: null,
        bid_count: 0,
        bids: [],
      })
    })
  },
})
