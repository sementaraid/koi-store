import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"
import { bidTooLowMessage } from "../../utils/bid"

// AC3: a below-minimum bid must carry the lot's CURRENT price (not the
// minimum the message names). Medusa's error handler sends only
// `{ type, code, message }` on a 400 and drops every other field, so the store
// route catches this error and re-emits the full body. `current_price` and
// `minimum` ride along because the workflow's serializeError copies the error's
// own props. `minimum` lets the Koi apps write their own (Indonesian) copy.
class BidTooLowError extends MedusaError {
  current_price: number
  minimum: number
  constructor(message: string, current_price: number, minimum: number) {
    super(MedusaError.Types.INVALID_DATA, message, "bid_too_low")
    this.current_price = current_price
    this.minimum = minimum
  }
}

export type BiddableLot = {
  lot_id: string
  // The lowest amount this bid may carry: OB when the lot has no bid yet,
  // else current price + KB (D-023). "First" means no bid that isn't removed;
  // removal (D-036) is US-072, so every existing row counts today.
  minimum: number
  previous_price: number
  ob: number
  kb: number
  end_time: string
  auction_id: string
}

// Read-only guard (US-042 AC1–AC3). Run under the lot lock, so the bid read and
// the bid/price writes cannot interleave with another bid on the same lot.
// The gate is the AUCTION's `live` status, not the lot's: a lot is `open`
// while its auction is still `scheduled` (US-033, US-050).
// ponytail: the ban check (AC1) lands in US-059 T-059.1 (D-047); this step
// deliberately has none. Upgrade: add it here, before the amount check.
export const getBiddableLotStep = createStep(
  "get-biddable-lot",
  async (
    input: { lot_id: string; customer_id: string; amount: number },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "ob",
        "kb",
        "current_price",
        "end_time",
        "status",
        "auction.id",
        "auction.status",
        "auction.payer_customer_id",
      ],
      filters: { id: input.lot_id },
    })

    if (!lot) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Lot ${input.lot_id} was not found`
      )
    }
    const auction = (lot.auction ?? {}) as {
      id?: string
      status?: string
      payer_customer_id?: string | null
    }

    // US-042 AC1 / plan "Fair play". The farmer's customer id was saved at
    // submit (D-033); checked before membership so it never reads 403
    // not_participant.
    if (auction.payer_customer_id === input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Anda tidak bisa bid di lelang milik kebun Anda.",
        "own_auction"
      )
    }
    // US-042 AC1 + US-041: only customers who joined the auction.
    const {
      data: [participant],
    } = await query.graph({
      entity: "auction_participant",
      fields: ["id"],
      filters: {
        auction_id: auction.id,
        customer_id: input.customer_id,
      },
    })
    if (!participant) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Anda belum ikut lelang ini.",
        "not_participant"
      )
    }
    // bid gate: the auction must be `live` (a lot stays `open` until US-050).
    if (auction.status !== "live") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "This auction is not live, so it isn't taking bids.",
        "auction_not_live"
      )
    }
    // A cancelled or closed lot never takes a bid, whatever its auction says.
    if (lot.status !== "open") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "This lot is not open for bids.",
        "lot_not_open"
      )
    }

    const {
      data: [lastBid],
    } = await query.graph({
      entity: "bid",
      fields: ["id"],
      filters: { lot_id: input.lot_id },
      pagination: { take: 1, order: { created_at: "DESC" } },
    })

    const ob = Number(lot.ob)
    const kb = Number(lot.kb)
    const previousPrice = Number(lot.current_price)
    // AC2 / D-023: the first bid may equal OB; every later bid ≥ current + KB.
    const minimum = lastBid ? previousPrice + kb : ob

    // Whole rupiah only: Zod already refuses non-integers, this also protects
    // callers that reach the workflow directly (US-082's WhatsApp bot).
    if (!Number.isSafeInteger(input.amount) || input.amount < 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Bid harus berupa rupiah bulat, minimal Rp1.",
        "invalid_amount"
      )
    }
    if (input.amount < minimum) {
      throw new BidTooLowError(
        bidTooLowMessage({
          minimum,
          current_price: previousPrice,
          has_bid: Boolean(lastBid),
        }),
        previousPrice,
        minimum
      )
    }

    const biddable: BiddableLot = {
      lot_id: input.lot_id,
      minimum,
      previous_price: previousPrice,
      ob,
      kb,
      end_time: new Date(lot.end_time as string).toISOString(),
      auction_id: auction.id as string,
    }
    return new StepResponse(biddable)
  }
)

export type CreateBidStepInput = {
  lot_id: string
  customer_id: string
  amount: number
}

// Single mutation: the bid row (AC5). `source` is `web` here; the WhatsApp bot
// passes `whatsapp` through the same workflow (US-082). Compensation deletes
// it, so a failed price update leaves no bid.
export const createBidStep = createStep(
  "create-bid",
  async (input: CreateBidStepInput, { container }) => {
    const service = container.resolve<AuctionModuleService>(AUCTION_MODULE)
    const [bid] = await service.createBids([
      {
        lot_id: input.lot_id,
        customer_id: input.customer_id,
        amount: input.amount,
        source: "web",
      },
    ])
    return new StepResponse(bid, bid.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await container
      .resolve<AuctionModuleService>(AUCTION_MODULE)
      .deleteBids([id])
  }
)

// Single mutation: the lot's current price (plan "Key flows: place bid").
// Compensation restores the previous price (the bid itself is compensated by
// the step above).
export const setLotCurrentPriceStep = createStep(
  "set-lot-current-price",
  async (
    input: { lot_id: string; amount: number; previous_price: number },
    { container }
  ) => {
    const service = container.resolve<AuctionModuleService>(AUCTION_MODULE)
    const [lot] = await service.updateLots([
      { id: input.lot_id, current_price: input.amount },
    ])
    return new StepResponse(lot, {
      lot_id: input.lot_id,
      previous_price: input.previous_price,
    })
  },
  async (
    restore: { lot_id: string; previous_price: number } | undefined,
    { container }
  ) => {
    if (!restore) {
      return
    }
    await container.resolve<AuctionModuleService>(AUCTION_MODULE).updateLots([
      { id: restore.lot_id, current_price: restore.previous_price },
    ])
  }
)
