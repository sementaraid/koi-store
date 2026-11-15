import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AUCTION_FIELDS,
  LOT_WITH_PHOTOS_FIELDS,
  type AuctionLotWithPhotos,
  toLotWithPhotos,
  toVendorAuction,
  type VendorAuction,
} from "../../vendor/auctions/route"
import type { AdminGetAuctionsParamsType } from "./validators"

// US-032 T-032.1 (AC1). Admin only (D-002): Medusa's /admin auth refuses any
// other actor before this runs.
export type AdminAuction = Omit<VendorAuction, "lots"> & {
  seller: { id: string; name: string } | null
  // The fee table row the auction was priced from; null if since deleted.
  fee_category: { id: string; name: string; listing_fee: number; join_fee: number } | null
  lots: AuctionLotWithPhotos[]
}

export type AdminAuctionsResponse = {
  auctions: AdminAuction[]
  count: number
  limit: number
  offset: number
}

export const ADMIN_AUCTION_FIELDS = [
  ...AUCTION_FIELDS,
  "seller.id",
  "seller.name",
  ...LOT_WITH_PHOTOS_FIELDS.map((field) => `lots.${field}`),
]

// No link from auction to the fee table, so the categories are one batched read.
export const toAdminAuctions = async (
  scope: MedusaContainer,
  rows: Record<string, unknown>[]
): Promise<AdminAuction[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const ids = [...new Set(rows.map((row) => row.fee_category_id as string))]
  const { data: categories } = ids.length
    ? await query.graph({
        entity: "fee_category",
        fields: ["id", "name", "listing_fee", "join_fee"],
        filters: { id: ids },
      })
    : { data: [] }
  const byId = new Map(categories.map((c) => [c.id, c]))

  return rows.map((row) => {
    const seller = row.seller as { id: string; name: string } | null | undefined
    const category = byId.get(row.fee_category_id as string)
    return {
      ...toVendorAuction(row),
      seller: seller ? { id: seller.id, name: seller.name } : null,
      fee_category: category
        ? {
            id: category.id,
            name: category.name,
            listing_fee: category.listing_fee,
            join_fee: category.join_fee,
          }
        : null,
      lots: ((row.lots ?? []) as Record<string, unknown>[]).map(toLotWithPhotos),
    }
  })
}

// One auction after a decision, in the queue's shape.
export const getAdminAuction = async (
  scope: MedusaContainer,
  id: string
): Promise<AdminAuction> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "auction",
    fields: ADMIN_AUCTION_FIELDS,
    filters: { id },
  })
  const [auction] = await toAdminAuctions(scope, data)
  return auction
}

// The /lelang approval queue: only `pending_approval` (D-031), oldest first so
// the admin works in arrival order.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAuctionsParamsType>,
  res: MedusaResponse<AdminAuctionsResponse>
) => {
  const { limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "auction",
    fields: ADMIN_AUCTION_FIELDS,
    filters: { status: "pending_approval" },
    pagination: { skip: offset, take: limit, order: { updated_at: "ASC" } },
  })

  res.json({
    auctions: await toAdminAuctions(req.scope, data),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
