import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"

const auctionService = (container: { resolve: <T>(key: string) => T }) =>
  container.resolve<AuctionModuleService>(AUCTION_MODULE)

export type CancellableLiveAuction = {
  id: string
  previous_status: string
}

// Read-only guard (US-091 T-091.1b, AC2, D-022): only a `live` auction is
// admin-cancellable. Run under the per-auction lock, so the status can't move
// between this read and the write. An unknown id is a 404; every other status
// is a 409 `auction_not_cancellable`. Medusa's error handler replaces the 409
// message at HTTP level, so the Koi apps key on the status; the Indonesian
// message and code stay for internal callers (D-055).
export const getCancellableLiveAuctionStep = createStep(
  "get-cancellable-live-auction",
  async (input: { auction_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: ["id", "status"],
      filters: { id: input.auction_id },
    })
    if (!auction) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Lelang tidak ditemukan."
      )
    }
    if (auction.status !== "live") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Hanya lelang yang sedang berjalan yang bisa dibatalkan admin.",
        "auction_not_cancellable"
      )
    }

    const cancellable: CancellableLiveAuction = {
      id: auction.id as string,
      previous_status: auction.status as string,
    }
    return new StepResponse(cancellable)
  }
)

type OpenLot = { id: string; status: string; cancel_reason: string | null }

// One mutation (US-091 T-091.1b, AC2, D-035, D-050): every `open` lot of the
// auction becomes `cancelled` with the admin's reason, in ONE `updateLots`
// call. Lots in any other status (`won` included) are never read for write and
// stay untouched. Compensation restores each lot's previous status/reason.
export const cancelOpenLotsStep = createStep(
  "cancel-open-lots",
  async (input: { auction_id: string; reason: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "cancel_reason"],
      filters: { auction_id: input.auction_id, status: "open" },
    })
    const previous = data as OpenLot[]
    if (!previous.length) {
      return new StepResponse([], [])
    }

    const updated = await auctionService(container).updateLots(
      previous.map((lot) => ({
        id: lot.id,
        status: "cancelled" as const,
        cancel_reason: input.reason,
      }))
    )
    return new StepResponse(updated, previous)
  },
  async (previous: OpenLot[] | undefined, { container }) => {
    if (!previous?.length) {
      return
    }
    await auctionService(container).updateLots(
      previous.map((lot) => ({
        id: lot.id,
        status: lot.status as never,
        cancel_reason: lot.cancel_reason,
      }))
    )
  }
)
