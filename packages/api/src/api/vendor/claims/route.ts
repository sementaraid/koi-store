import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { assertSellerNotTerminated } from "../../../workflows/steps/sold-lot"
import type { VendorGetClaimsParamsType } from "./validators"
import { readVendorClaimStatus } from "./validators"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../types/seller-context"

// US-054 T-054.1b (AC3, D-018, D-042, D-045, D-052, D-054): the farmer's claim
// queue. The row carries `has_video`, never the file key or a URL; the winner
// is a name only (no phone, address or customer id); the product is title and
// thumbnail only.
export type ClaimListRow = {
  id: string
  lot_id: string
  status: string
  remedy: string
  // The claim row's created_at (no separate column).
  opened_at: string
  has_video: boolean
  winner: { name: string }
  product: { title: string | null; thumbnail: string | null }
  // US-056: the two resolution timestamps, ISO or null.
  resolved_at: string | null
  confirmed_at: string | null
}

export type VendorClaimsResponse = {
  claims: ClaimListRow[]
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
  resolved_at: Date | string | null
  confirmed_at: Date | string | null
}

// D-042/D-052: name only. `phone`, `email` and the id are never selected.
export const winnersById = async (
  scope: MedusaContainer,
  ids: string[]
): Promise<Map<string, { name: string }>> => {
  const byId = new Map<string, { name: string }>()
  if (!ids.length) return byId
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name"],
    filters: { id: ids },
  })
  for (const customer of data as {
    id: string
    first_name?: string | null
    last_name?: string | null
  }[]) {
    byId.set(customer.id, {
      name: [customer.first_name, customer.last_name].filter(Boolean).join(" "),
    })
  }
  return byId
}

// One query for the page's lots, one for their winners. The claim stores
// `lot_id` as a soft reference, so this is how product, seller and winner are
// reached without a link (CLAUDE.md §9).
type LotInfo = {
  winner_customer_id?: string | null
  product?: { title?: string | null; thumbnail?: string | null } | null
  auction?: { seller?: { name?: string | null } | null } | null
}

export const readClaimLotInfo = async (
  scope: MedusaContainer,
  lotIds: string[]
): Promise<Map<string, LotInfo>> => {
  const byId = new Map<string, LotInfo>()
  if (!lotIds.length) return byId
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "winner_customer_id",
      "product.title",
      "product.thumbnail",
      "auction.seller.name",
    ],
    filters: { id: lotIds },
  })
  for (const lot of data as (LotInfo & { id: string })[]) {
    byId.set(lot.id, lot)
  }
  return byId
}

export const toClaimListRows = (
  claims: ClaimRecord[],
  lots: Map<string, LotInfo>,
  winners: Map<string, { name: string }>
): ClaimListRow[] =>
  claims.map((claim) => {
    const lot = lots.get(claim.lot_id)
    const winnerId = lot?.winner_customer_id
    return {
      id: claim.id,
      lot_id: claim.lot_id,
      status: claim.status,
      remedy: claim.remedy,
      opened_at: new Date(claim.created_at).toISOString(),
      // The POST requires an upload and every row stores its key.
      has_video: true,
      winner: (winnerId && winners.get(winnerId)) || { name: "" },
      product: {
        title: lot?.product?.title ?? null,
        thumbnail: lot?.product?.thumbnail ?? null,
      },
      resolved_at: claim.resolved_at
        ? new Date(claim.resolved_at).toISOString()
        : null,
      confirmed_at: claim.confirmed_at
        ? new Date(claim.confirmed_at).toISOString()
        : null,
    }
  })

// AC3: the claim appears in the Farmer area. Scoped to
// `req.seller_context.seller_id` (D-003). Read only: ownership + not
// `terminated` (D-054), not the open-step gate. Newest first.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, VendorGetClaimsParamsType>,
  res: MedusaResponse<VendorClaimsResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  await assertSellerNotTerminated(req.scope, sellerId)

  // Captured by the global middleware before Mercur's own query validator
  // (validators.ts). The route's validatedQuery has no `status`.
  const status = readVendorClaimStatus(req)
  const { limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "claim",
    fields: [
      "id",
      "lot_id",
      "status",
      "remedy",
      "created_at",
      "resolved_at",
      "confirmed_at",
    ],
    filters: { seller_id: sellerId, ...(status ? { status } : {}) },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
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

  res.json({
    claims: toClaimListRows(claims, lots, winners),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
