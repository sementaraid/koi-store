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

// US-054 T-054.1b (AC3, D-002, D-018, D-042, D-052): the admin-koi claim
// queue. Same row as the farmer's plus the farm name, still masked PII only:
// no phone, no address, no customer id, never the video key or a URL.
// US-055 T-055.1b adds the admin decision fields to this row only (the farmer's
// `toClaimListRows` is untouched).
export type AdminClaimListRow = ClaimListRow & {
  seller: { name: string }
  decided_at: string | null
  decision_reason: string | null
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
  status: string
  remedy: string
  created_at: Date | string
  decided_at: Date | string | null
  decision_reason: string | null
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
      "status",
      "remedy",
      "created_at",
      "decided_at",
      "decision_reason",
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
      },
    ])
  )

  res.json({
    claims: rows.map((row) => {
      const decision = decisionById.get(row.id)
      return {
        ...row,
        seller: { name: lots.get(row.lot_id)?.auction?.seller?.name ?? "" },
        decided_at: decision?.decided_at ?? null,
        decision_reason: decision?.decision_reason ?? null,
      }
    }),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
