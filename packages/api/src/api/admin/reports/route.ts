import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { winnersById } from "../../vendor/claims/route"
import { PAY_WINDOW_MS } from "../../../utils/pay-window"
import { readActiveStrikeCounts } from "../../../utils/strike"
import type { AdminGetReportsParamsType } from "./validators"

// US-058 T-058.3 (AC1, D-002, D-026, D-037, D-042, D-045): the admin-koi
// unpaid-report queue. Ids and names only: no phone, email, street, bank or
// NIK is ever selected, and nothing about a second bidder exists (D-026). The
// winner is a customer, so `id` and `customer_id` are the same id; the strike
// UI needs it for `GET /admin/strikes?customer_id=` and the explicit subject.
export type AdminReportListRow = {
  id: string
  lot_id: string
  status: string
  // The report row's created_at (no separate column).
  reported_at: string
  // D-058: the lot's closed_at + 24 h, ISO; null when the lot has no closed_at.
  pay_by: string | null
  winner: { id: string; name: string; customer_id: string | null }
  seller: { name: string }
  product: { title: string | null; thumbnail: string | null }
  // US-059 T-059.1a (AC2): the winner's derived state, so the admin sees the
  // count before giving a second strike.
  active_strikes: number
  banned: boolean
}

export type AdminReportsResponse = {
  reports: AdminReportListRow[]
  count: number
  limit: number
  offset: number
}

type ReportRecord = {
  id: string
  lot_id: string
  status: string
  created_at: Date | string
}

type ReportLotInfo = {
  closed_at?: Date | string | null
  winner_customer_id?: string | null
  product?: { title?: string | null; thumbnail?: string | null } | null
  auction?: { seller?: { name?: string | null } | null } | null
}

// One query for the page's lots; product, seller and the lot's `closed_at`
// (for `pay_by`) come from the same row. No per-row queries.
const readReportLotInfo = async (
  scope: MedusaContainer,
  lotIds: string[]
): Promise<Map<string, ReportLotInfo>> => {
  if (!lotIds.length) return new Map()
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "closed_at",
      "winner_customer_id",
      "product.title",
      "product.thumbnail",
      "auction.seller.name",
    ],
    filters: { id: lotIds },
  })
  return new Map(
    (data as (ReportLotInfo & { id: string })[]).map((lot) => [lot.id, lot])
  )
}

// Medusa's /admin auth rejects any non-admin actor before this runs (D-002).
// Arrival order (`created_at` ASC). `winner_id` reads one winner's reports
// across all time (D-037), so it ignores the `open` default.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetReportsParamsType>,
  res: MedusaResponse<AdminReportsResponse>
) => {
  const { status, winner_id, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "lot_report",
    fields: ["id", "lot_id", "status", "created_at"],
    filters: winner_id
      ? { winner_customer_id: winner_id }
      : { status },
    pagination: { skip: offset, take: limit, order: { created_at: "ASC" } },
  })
  const reports = data as ReportRecord[]

  const lots = await readReportLotInfo(
    req.scope,
    [...new Set(reports.map((row) => row.lot_id))]
  )
  // US-059 T-059.1a: one batched strike read for the page's winners, no N+1.
  const winnerIds = [...new Set(
    [...lots.values()]
      .map((lot) => lot.winner_customer_id)
      .filter((id): id is string => typeof id === "string")
  )]
  const winners = await winnersById(req.scope, winnerIds)
  const strikesByCustomer = await readActiveStrikeCounts(query, winnerIds)

  res.json({
    reports: reports.map((row) => {
      const lot = lots.get(row.lot_id)
      const winnerId = lot?.winner_customer_id
      const closedAt = lot?.closed_at ? new Date(lot.closed_at) : null
      const strikes = winnerId ? strikesByCustomer.get(winnerId) : undefined
      return {
        id: row.id,
        lot_id: row.lot_id,
        status: row.status,
        reported_at: new Date(row.created_at).toISOString(),
        pay_by:
          closedAt === null
            ? null
            : new Date(closedAt.getTime() + PAY_WINDOW_MS).toISOString(),
        winner: {
          id: winnerId ?? "",
          name: winnerId ? (winners.get(winnerId)?.name ?? "") : "",
          customer_id: winnerId ?? null,
        },
        seller: { name: lot?.auction?.seller?.name ?? "" },
        product: {
          title: lot?.product?.title ?? null,
          thumbnail: lot?.product?.thumbnail ?? null,
        },
        active_strikes: strikes?.active_count ?? 0,
        banned: strikes?.banned ?? false,
      }
    }),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
