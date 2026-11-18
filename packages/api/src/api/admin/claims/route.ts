import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  readClaimLotInfo,
  toClaimListRows,
  winnersById,
  type ClaimListRow,
} from "../../vendor/claims/route"
import type { AdminGetClaimsParamsType } from "./validators"
import {
  readActiveStrikeCounts,
  readSellerCustomerIds,
} from "../../../utils/strike"

// US-054 T-054.1b (AC3, D-002, D-018, D-042, D-052): the admin-koi claim
// queue. Same row as the farmer's plus the farm name, still masked PII only:
// no phone, no address, no customer id, never the video key or a URL.
// US-055 T-055.1b adds the admin decision fields to this row only (the farmer's
// `toClaimListRows` is untouched).
// US-059 T-059.1a (AC2) adds the seller's derived `active_strikes`/`banned`.
// T-059.2: the seller's `id` and its own customer id let the admin strike the
// exact farm (`{ seller_id }` or `{ customer_id }`) instead of guessing a name.
export type AdminClaimListRow = ClaimListRow & {
  seller: { id: string; name: string; customer_id: string | null }
  decided_at: string | null
  decision_reason: string | null
  // US-056: the farmer's 3-day clock starts here (D-038, AC2 data half).
  approved_at: string | null
  active_strikes: number
  banned: boolean
}

export type AdminClaimsResponse = {
  claims: AdminClaimListRow[]
  count: number
  limit: number
  offset: number
}

type ClaimRecord = {
  id: string
  lot_id: string
  seller_id: string
  status: string
  remedy: string
  created_at: Date | string
  decided_at: Date | string | null
  decision_reason: string | null
  approved_at: Date | string | null
  resolved_at: Date | string | null
  confirmed_at: Date | string | null
  // US-061: null while the private video is still stored.
  video_deleted_at: Date | string | null
}

// Medusa's /admin auth rejects any non-admin actor before this runs (D-002).
// Arrival order (`opened_at` ASC), like the auction queue; status defaults to
// `open` in the validator.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetClaimsParamsType>,
  res: MedusaResponse<AdminClaimsResponse>
) => {
  const { status, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "claim",
    fields: [
      "id",
      "lot_id",
      "seller_id",
      "status",
      "remedy",
      "created_at",
      "decided_at",
      "decision_reason",
      "approved_at",
      "resolved_at",
      "confirmed_at",
      "video_deleted_at",
    ],
    filters: { status },
    pagination: { skip: offset, take: limit, order: { created_at: "ASC" } },
  })
  const claims = data as ClaimRecord[]

  const lots = await readClaimLotInfo(
    req.scope,
    [...new Set(claims.map((claim) => claim.lot_id))]
  )
  const winners = await winnersById(req.scope, [
    ...new Set(
      [...lots.values()]
        .map((lot) => lot.winner_customer_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ])

  const rows = toClaimListRows(claims, lots, winners)
  // Same order and same length: toClaimListRows maps 1:1 over `claims`.
  const decisionById = new Map(
    claims.map((claim) => [
      claim.id,
      {
        decided_at: claim.decided_at
          ? new Date(claim.decided_at).toISOString()
          : null,
        decision_reason: claim.decision_reason,
        approved_at: claim.approved_at
          ? new Date(claim.approved_at).toISOString()
          : null,
      },
    ])
  )

  // US-059 T-059.1a: the seller behind each claim (D-003), then one batched
  // strike read for the page's customers. No per-row query.
  const sellerCustomerIds = await readSellerCustomerIds(
    req.scope,
    query,
    claims.map((claim) => claim.seller_id)
  )
  const strikesByCustomer = await readActiveStrikeCounts(
    query,
    [...sellerCustomerIds.values()]
  )

  res.json({
    claims: rows.map((row, index) => {
      const decision = decisionById.get(row.id)
      const sellerId = claims[index].seller_id
      const customerId = sellerCustomerIds.get(sellerId)
      const strikes = customerId ? strikesByCustomer.get(customerId) : undefined
      return {
        ...row,
        seller: {
          id: sellerId,
          name: lots.get(row.lot_id)?.auction?.seller?.name ?? "",
          customer_id: customerId ?? null,
        },
        decided_at: decision?.decided_at ?? null,
        decision_reason: decision?.decision_reason ?? null,
        approved_at: decision?.approved_at ?? null,
        active_strikes: strikes?.active_count ?? 0,
        banned: strikes?.banned ?? false,
      }
    }),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
