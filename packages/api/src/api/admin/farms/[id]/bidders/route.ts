import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { winnersById } from "../../../../vendor/claims/route"
import { isShillShare, isShillUnpaid } from "../../../../../utils/shill"
import type { AdminGetFarmBiddersParamsType } from "./validators"

// US-071 T-071.1 (AC1–AC3, D-002, D-028, D-037, D-042). Per-farmer bidder table
// for the admin: bid count, lots bid on, wins, unpaid wins, and the two flags.
// Every count is all time; removed bids never count (US-072 AC2). Read only —
// nothing is written and nothing acts on a flag (the admin bans by hand).
// Full name plus opaque customer id, no contact field, like the report rows.

// A lot that ever had a winner (D-037's win statuses).
const WIN_STATUSES = ["won", "paid", "shipped", "delivered", "claimed"] as const

export type AdminFarmBidderFlags = { share: boolean; unpaid: boolean }

export type AdminFarmBidder = {
  customer_id: string
  name: string
  bid_count: number
  lots_bid_on: number
  wins: number
  unpaid_wins: number
  flags: AdminFarmBidderFlags
  flagged: boolean
}

export type AdminFarmBiddersResponse = {
  seller: { id: string; name: string }
  bidders: AdminFarmBidder[]
  count: number
  limit: number
  offset: number
}

type LotRow = {
  id: string
  status: string
  winner_customer_id: string | null
}

type BidRow = {
  id: string
  customer_id: string
  lot_id: string
  removed_at: Date | string | null
}

// Medusa's /admin auth rejects any non-admin actor before this runs (D-002).
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetFarmBiddersParamsType>,
  res: MedusaResponse<AdminFarmBiddersResponse>
) => {
  const { limit = 50, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { id: req.params.id },
  })
  if (!seller) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Kebun tidak ditemukan.")
  }

  // 1. The farmer's lots, one read. Their ids scope the farm bids below.
  const { data: lots } = await query.graph({
    entity: "lot",
    fields: ["id", "status", "winner_customer_id"],
    filters: { auction: { seller_id: seller.id } },
  })
  const lotRows = lots as LotRow[]
  const lotIds = lotRows.map((lot) => lot.id)

  // 2. Farm bids, one read. Removed rows are dropped in memory.
  const { data: farmBidData } = lotIds.length
    ? await query.graph({
        entity: "bid",
        fields: ["id", "customer_id", "lot_id", "removed_at"],
        filters: { lot_id: lotIds },
      })
    : { data: [] }

  const farmBids = (farmBidData as BidRow[]).filter(
    (bid) => bid.removed_at == null
  )

  const farmBidCount = new Map<string, number>()
  const farmLotsByBidder = new Map<string, Set<string>>()
  for (const bid of farmBids) {
    farmBidCount.set(bid.customer_id, (farmBidCount.get(bid.customer_id) ?? 0) + 1)
    const set = farmLotsByBidder.get(bid.customer_id) ?? new Set<string>()
    set.add(bid.lot_id)
    farmLotsByBidder.set(bid.customer_id, set)
  }
  // A row exists only when the bidder bid on the farm (farm_bids > 0).
  const bidderIds = [...farmBidCount.keys()]

  // 3. Wins: lots of this farmer won by each bidder, all time.
  const winsByBidder = new Map<string, number>()
  for (const lot of lotRows) {
    const winner = lot.winner_customer_id
    if (!winner || !WIN_STATUSES.includes(lot.status as (typeof WIN_STATUSES)[number])) {
      continue
    }
    winsByBidder.set(winner, (winsByBidder.get(winner) ?? 0) + 1)
  }

  // 4. Unpaid wins: one `lot_report` row per report (D-037), counted per winner.
  const { data: reportData } = await query.graph({
    entity: "lot_report",
    fields: ["winner_customer_id"],
    filters: { seller_id: seller.id },
  })
  const unpaidByBidder = new Map<string, number>()
  for (const row of reportData as { winner_customer_id: string }[]) {
    unpaidByBidder.set(
      row.winner_customer_id,
      (unpaidByBidder.get(row.winner_customer_id) ?? 0) + 1
    )
  }

  // 5. Denominator: every non-removed bid by these bidders, any farmer.
  const { data: allBidData } = bidderIds.length
    ? await query.graph({
        entity: "bid",
        fields: ["customer_id", "removed_at"],
        filters: { customer_id: bidderIds },
      })
    : { data: [] }
  const totalBids = new Map<string, number>()
  for (const bid of allBidData as BidRow[]) {
    if (bid.removed_at != null) continue
    totalBids.set(bid.customer_id, (totalBids.get(bid.customer_id) ?? 0) + 1)
  }

  const names = await winnersById(req.scope, bidderIds)

  const bidders: AdminFarmBidder[] = bidderIds.map((customerId) => {
    const bidCount = farmBidCount.get(customerId) ?? 0
    const unpaidWins = unpaidByBidder.get(customerId) ?? 0
    const share = isShillShare(bidCount, totalBids.get(customerId) ?? 0)
    const unpaid = isShillUnpaid(unpaidWins)
    return {
      customer_id: customerId,
      name: names.get(customerId)?.name ?? "",
      bid_count: bidCount,
      lots_bid_on: farmLotsByBidder.get(customerId)?.size ?? 0,
      wins: winsByBidder.get(customerId) ?? 0,
      unpaid_wins: unpaidWins,
      flags: { share, unpaid },
      flagged: share || unpaid,
    }
  })

  // Flagged first, then the busiest bidder; paginate after the computation.
  bidders.sort(
    (a, b) =>
      Number(b.flagged) - Number(a.flagged) ||
      b.bid_count - a.bid_count ||
      a.customer_id.localeCompare(b.customer_id)
  )

  res.json({
    seller: { id: seller.id, name: seller.name },
    bidders: bidders.slice(offset, offset + limit),
    count: bidders.length,
    limit,
    offset,
  })
}
