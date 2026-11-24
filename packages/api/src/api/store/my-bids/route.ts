import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { LotStatus } from "../../../modules/auction/models/lot"
import { STORE_LOT_FIELDS, toStoreLots, type StoreLot } from "../lots/route"
import type { StoreGetMyBidsParamsType } from "./validators"

// US-096 T-096.2 (AC4, AC5): the caller's own position on every lot they hold a
// non-removed bid on. Customer token only (middlewares.ts); identity from
// auth_context. Reads only. `won`/`lost` come from the lot's saved
// winner_customer_id and status (set by the close job), never recomputed.
// No other customer's id or name leaves this route: `lot` is the same public
// shape as `GET /store/lots`, and only the caller's own amounts are added.

export type MyBidPosition = "highest" | "outbid" | "won" | "lost" | "cancelled"

export type StoreMyBidLot = {
  lot_id: string
  position: MyBidPosition
  // The raw lot status (`open`, `won`, `paid`, `shipped`, …) for the caller's
  // own lots. null when `lost`: another customer's result stays private.
  lot_status: LotStatus | null
  my_highest_bid: number
  // The caller's non-removed bids, newest first, for the "Anda" history label.
  my_bids: { amount: number; created_at: string }[]
  lot: StoreLot
}

export type StoreMyBidsResponse = { lots: StoreMyBidLot[] }

type LotBid = {
  id: string
  customer_id: string
  amount: number
  created_at: string | Date
  removed_at: string | Date | null
}

// Same rule as the close step and the removal step: highest amount, ties to
// the first recorded, removed bids excluded (US-072 AC2/AC3).
const topBidder = (bids: LotBid[]): string | null => {
  const [top] = bids
    .filter((bid) => bid.removed_at == null)
    .sort(
      (a, b) =>
        Number(b.amount) - Number(a.amount) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
        a.id.localeCompare(b.id)
    )
  return top?.customer_id ?? null
}

const positionOf = (
  row: Record<string, unknown>,
  customerId: string
): MyBidPosition => {
  if (row.status === "cancelled") return "cancelled"
  if (row.winner_customer_id === customerId) return "won"
  if (row.status === "open") {
    return topBidder((row.bids ?? []) as LotBid[]) === customerId
      ? "highest"
      : "outbid"
  }
  return "lost"
}

// ponytail: no pagination — a customer's lots are a few dozen in the MVP; add
// limit/offset when Bid Saya needs it.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, StoreGetMyBidsParamsType>,
  res: MedusaResponse<StoreMyBidsResponse>
) => {
  const customerId = req.auth_context.actor_id
  const { lot_id } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: bids } = await query.graph({
    entity: "bid",
    fields: ["id", "lot_id", "amount", "created_at"],
    filters: {
      customer_id: customerId,
      removed_at: null,
      ...(lot_id ? { lot_id } : {}),
    },
  })

  const own = new Map<string, { amount: number; created_at: string }[]>()
  for (const bid of [...bids].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
      b.id.localeCompare(a.id)
  )) {
    const list = own.get(bid.lot_id) ?? []
    list.push({
      amount: Number(bid.amount),
      created_at: new Date(bid.created_at).toISOString(),
    })
    own.set(bid.lot_id, list)
  }
  if (!own.size) {
    return res.json({ lots: [] })
  }

  // One read for every lot (with its bids for the top bidder), then the shared
  // batched mapper (categories, lot numbers). winner_customer_id is read for
  // the position only; the mapper never emits it.
  const { data: rows } = await query.graph({
    entity: "lot",
    fields: [...STORE_LOT_FIELDS, "winner_customer_id"],
    filters: { id: [...own.keys()] },
    pagination: { order: { end_time: "ASC" } },
  })
  const lots = await toStoreLots(req.scope, rows)

  res.json({
    lots: rows.map((row, i) => {
      const position = positionOf(row, customerId)
      const mine = own.get(row.id as string) ?? []
      return {
        lot_id: row.id as string,
        position,
        lot_status: position === "lost" ? null : (row.status as LotStatus),
        my_highest_bid: Math.max(...mine.map((bid) => bid.amount)),
        my_bids: mine,
        lot: lots[i],
      }
    }),
  })
}
