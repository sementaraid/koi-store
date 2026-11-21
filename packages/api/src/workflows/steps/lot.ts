import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"
import type { LotDTO } from "../../modules/auction/service"

const auctionService = (container: { resolve: <T>(key: string) => T }) =>
  container.resolve<AuctionModuleService>(AUCTION_MODULE)

export type LotFields = Partial<
  Pick<
    LotDTO,
    | "status"
    | "winner_customer_id"
    | "final_price"
    | "closed_at"
    | "tracking_number"
    | "shipped_at"
    | "delivered_at"
    | "cancel_reason"
  >
>

// Single mutation on one lot (US-050 close; US-052/053 reuse it for
// paid/shipped/delivered). Callers check the current status first under the
// `lot:<id>` lock. Compensation restores exactly the fields this step changed.
// Copy of setAuctionFieldsStep (steps/auction.ts).
export const setLotFieldsStep = createStep(
  "set-lot-fields",
  async (input: { id: string; update: LotFields }, { container }) => {
    const service = auctionService(container)
    const previous = await service.retrieveLot(input.id)
    const [updated] = await service.updateLots([{ id: input.id, ...input.update }])
    const restore = Object.fromEntries(
      Object.keys(input.update).map((key) => [key, previous[key as keyof LotFields]])
    ) as LotFields
    return new StepResponse(updated, { id: input.id, restore })
  },
  async (
    compensation: { id: string; restore: LotFields } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    await auctionService(container).updateLots([
      { id: compensation.id, ...compensation.restore },
    ])
  }
)

export type ClosableLot = { close: boolean; update: LotFields }

// US-050 T-050.1 (AC2, AC3, D-035, D-036). Read-only guard, run under the
// `lot:<id>` lock: close only an `open` lot of a `live` auction (or a `closed`
// one, bug A: a lot stranded `open` under a closed auction) whose end_time has
// passed on the server clock (US-043 moves end_time, so an extended lot is not
// due yet). A cancelled lot, a lot of a scheduled or cancelled auction, or one
// already closed is skipped, not an error.
// Winner = highest bid; of equal amounts the first recorded (plan "Bidding").
// US-072 (AC2): a removed bid never wins, so the read skips it; every bid
// removed makes the lot `unsold`.
export const getClosableLotStep = createStep(
  "get-closable-lot",
  async (input: { lot_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const now = new Date()
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "end_time", "auction.status"],
      filters: { id: input.lot_id },
    })
    // `closed` is included: bug A. A close-auction tick that saw every lot
    // closed/cancelled sets the auction `closed`; a lot still `open` under it
    // (cancelled-lot tick race, a manual cancel) could then never close and
    // stayed "live" on the store pages forever. `scheduled`/`cancelled`/
    // `draft` are still skipped — those lots have not run.
    const due =
      lot?.status === "open" &&
      (lot.auction?.status === "live" ||
        lot.auction?.status === "closed") &&
      new Date(lot.end_time as string).getTime() <= now.getTime()
    if (!due) {
      return new StepResponse<ClosableLot>({ close: false, update: {} })
    }

    // US-072 T-072.1a (AC2): removed bids are excluded from the winner.
    const {
      data: [top],
    } = await query.graph({
      entity: "bid",
      fields: ["customer_id", "amount"],
      filters: { lot_id: input.lot_id, removed_at: null },
      pagination: { take: 1, order: { amount: "DESC", created_at: "ASC" } },
    })

    const update: LotFields = top
      ? {
          status: "won",
          winner_customer_id: top.customer_id,
          final_price: Number(top.amount),
          closed_at: now,
        }
      : { status: "unsold", closed_at: now }
    return new StepResponse<ClosableLot>({ close: true, update })
  }
)

export type CancellableLot = { id: string; auction_id: string; status: string }

// US-091 T-091.1a (AC1, D-035). Read-only guard, run under the `lot:<id>` lock:
// only an `open` lot is cancellable, whatever its auction's state. Every other
// status is a 409 `lot_not_cancellable`; an unknown id is a 404. No bid or
// winner is read or written — a cancelled lot never takes a bid (D-024).
export const getCancellableLotStep = createStep(
  "get-cancellable-lot",
  async (input: { lot_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "auction_id"],
      filters: { id: input.lot_id },
    })
    if (!lot) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (lot.status !== "open") {
      // 409: Medusa's handler replaces the message, so the Koi apps key on the
      // status; the code is kept for internal callers.
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Hanya lot yang masih terbuka yang bisa dibatalkan.",
        "lot_not_cancellable"
      )
    }

    return new StepResponse<CancellableLot>({
      id: lot.id as string,
      auction_id: lot.auction_id as string,
      status: lot.status as string,
    })
  }
)
