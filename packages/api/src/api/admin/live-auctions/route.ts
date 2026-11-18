import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { AdminGetLiveAuctionsParamsType } from "./validators"

// US-072 T-072.1b (D-002, D-042, D-052). The admin-koi live monitoring list:
// only `live` auctions, newest start first, each with its lots. Names and ids
// only — a seller's phone or email is never selected.

export type AdminLiveLot = {
  id: string
  title: string | null
  thumbnail: string | null
  ob: number
  kb: number
  current_price: number
  end_time: string
  status: string
  // Non-removed rows only (US-072 AC2).
  bid_count: number
  cancel_reason: string | null
}

export type AdminLiveAuction = {
  id: string
  seller: { id: string; name: string } | null
  start_at: string
  end_at: string
  status: string
  lots: AdminLiveLot[]
}

export type AdminLiveAuctionsResponse = {
  auctions: AdminLiveAuction[]
  count: number
  limit: number
  offset: number
}

type AuctionRow = {
  id: string
  start_at: Date | string
  end_at: Date | string
  status: string
  seller?: { id: string; name: string } | null
}

type LotRow = {
  id: string
  auction_id: string
  ob: number
  kb: number
  current_price: number
  end_time: Date | string
  status: string
  cancel_reason: string | null
  product?: { title?: string | null; thumbnail?: string | null } | null
  bids?: { id: string; removed_at: Date | string | null }[]
}

const toLiveLot = (row: LotRow): AdminLiveLot => ({
  id: row.id,
  title: row.product?.title ?? null,
  thumbnail: row.product?.thumbnail ?? null,
  ob: Number(row.ob),
  kb: Number(row.kb),
  current_price: Number(row.current_price),
  end_time: new Date(row.end_time).toISOString(),
  status: row.status,
  bid_count: (row.bids ?? []).filter((bid) => bid.removed_at == null).length,
  cancel_reason: row.cancel_reason,
})

// Medusa's /admin auth rejects any non-admin actor before this runs (D-002).
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetLiveAuctionsParamsType>,
  res: MedusaResponse<AdminLiveAuctionsResponse>
) => {
  const { limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "auction",
    fields: ["id", "seller.id", "seller.name", "start_at", "end_at", "status"],
    filters: { status: "live" },
    pagination: { skip: offset, take: limit, order: { start_at: "DESC" } },
  })
  const auctions = data as AuctionRow[]

  // One batched read for the page's lots; no per-auction query.
  const { data: lots } = auctions.length
    ? await query.graph({
        entity: "lot",
        fields: [
          "id",
          "auction_id",
          "ob",
          "kb",
          "current_price",
          "end_time",
          "status",
          "cancel_reason",
          "product.title",
          "product.thumbnail",
          "bids.id",
          "bids.removed_at",
        ],
        filters: { auction_id: auctions.map((auction) => auction.id) },
      })
    : { data: [] }

  const lotsByAuction = new Map<string, AdminLiveLot[]>()
  for (const row of lots as LotRow[]) {
    const bucket = lotsByAuction.get(row.auction_id) ?? []
    bucket.push(toLiveLot(row))
    lotsByAuction.set(row.auction_id, bucket)
  }

  res.json({
    auctions: auctions.map((auction) => ({
      id: auction.id,
      seller: auction.seller
        ? { id: auction.seller.id, name: auction.seller.name }
        : null,
      start_at: new Date(auction.start_at).toISOString(),
      end_at: new Date(auction.end_at).toISOString(),
      status: auction.status,
      lots: lotsByAuction.get(auction.id) ?? [],
    })),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
