import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createAuctionWorkflow } from "../../../workflows/create-auction"
import type {
  VendorCreateAuctionType,
  VendorGetAuctionsParamsType,
} from "./validators"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../types/seller-context"

export type VendorAuctionLot = {
  id: string
  product_id: string
  ob: number
  kb: number
  current_price: number
  end_time: string
  status: string
  winner_customer_id: string | null
  final_price: number | null
  cancel_reason: string | null
}

export type VendorAuction = {
  id: string
  seller_id: string
  fee_category_id: string
  status: string
  start_at: string
  end_at: string
  delivery_method: string
  listing_fee: number
  join_fee: number
  extend_window_minutes: number
  payer_customer_id: string | null
  fee_override_listing_fee: number | null
  fee_override_join_fee: number | null
  fee_override_reason: string | null
  rejection_reason: string | null
  // D-061: the farmer's YouTube/Instagram live link, null when unset.
  live_stream_url: string | null
  lots?: VendorAuctionLot[]
}

export type VendorAuctionResponse = { auction: VendorAuction }
export type VendorAuctionsResponse = {
  auctions: (VendorAuction & { lot_count: number })[]
  count: number
  limit: number
  offset: number
}

export const AUCTION_FIELDS = [
  "id",
  "seller_id",
  "fee_category_id",
  "status",
  "start_at",
  "end_at",
  "delivery_method",
  "listing_fee",
  "join_fee",
  "extend_window_minutes",
  "payer_customer_id",
  "fee_override_listing_fee",
  "fee_override_join_fee",
  "fee_override_reason",
  "rejection_reason",
  "live_stream_url",
]

export const LOT_FIELDS = [
  "id",
  "product_id",
  "ob",
  "kb",
  "current_price",
  "end_time",
  "status",
  "winner_customer_id",
  "final_price",
  "cancel_reason",
]

export const toVendorLot = (lot: Record<string, unknown>): VendorAuctionLot => ({
  id: lot.id as string,
  product_id: lot.product_id as string,
  ob: lot.ob as number,
  kb: lot.kb as number,
  current_price: lot.current_price as number,
  end_time: new Date(lot.end_time as string).toISOString(),
  status: lot.status as string,
  winner_customer_id: (lot.winner_customer_id as string | null) ?? null,
  final_price: (lot.final_price as number | null) ?? null,
  cancel_reason: (lot.cancel_reason as string | null) ?? null,
})

// A lot with the koi listing it points at (title, photos), for the farmer's
// draft view and the admin queue (US-032 AC1).
export type AuctionLotWithPhotos = VendorAuctionLot & {
  title: string | null
  photos: string[]
}

export const LOT_WITH_PHOTOS_FIELDS = [
  ...LOT_FIELDS,
  "product.title",
  "product.images.url",
]

export const toLotWithPhotos = (
  lot: Record<string, unknown>
): AuctionLotWithPhotos => {
  const product = lot.product as
    | { title?: string | null; images?: { url: string }[] | null }
    | null
    | undefined
  return {
    ...toVendorLot(lot),
    title: product?.title ?? null,
    photos: (product?.images ?? []).map((image) => image.url),
  }
}

export const toVendorAuction = (
  auction: Record<string, unknown>
): VendorAuction => ({
  id: auction.id as string,
  seller_id: auction.seller_id as string,
  fee_category_id: auction.fee_category_id as string,
  status: auction.status as string,
  start_at: new Date(auction.start_at as string).toISOString(),
  end_at: new Date(auction.end_at as string).toISOString(),
  delivery_method: auction.delivery_method as string,
  listing_fee: auction.listing_fee as number,
  join_fee: auction.join_fee as number,
  extend_window_minutes: auction.extend_window_minutes as number,
  payer_customer_id: (auction.payer_customer_id as string | null) ?? null,
  fee_override_listing_fee:
    (auction.fee_override_listing_fee as number | null) ?? null,
  fee_override_join_fee:
    (auction.fee_override_join_fee as number | null) ?? null,
  fee_override_reason: (auction.fee_override_reason as string | null) ?? null,
  rejection_reason: (auction.rejection_reason as string | null) ?? null,
  live_stream_url: (auction.live_stream_url as string | null) ?? null,
})

// AC6/AC7: the list carries the stored fee and extend-window snapshots so the
// Farmer area shows what each auction was priced at. Scoped to the caller's
// seller from `req.seller_context` (D-003).
export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetAuctionsParamsType>,
  res: MedusaResponse<VendorAuctionsResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const limit = req.validatedQuery.limit ?? 20
  const offset = req.validatedQuery.offset ?? 0
  const status = req.validatedQuery.status

  const { data, metadata } = await query.graph({
    entity: "auction",
    fields: [...AUCTION_FIELDS, "lots.id"],
    filters: {
      seller_id: req.seller_context!.seller_id,
      ...(status ? { status } : {}),
    },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({
    auctions: data.map((auction) => ({
      ...toVendorAuction(auction),
      lot_count: auction.lots?.length ?? 0,
    })),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}

// T-030.2. Identity is `req.seller_context` (D-003); the body carries no
// seller and no fees (AC4, AC5). Fees and the extend window are snapshotted
// from the fee table and the settings (AC6, AC7); the auction is `draft`
// (AC8).
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateAuctionType>,
  res: MedusaResponse<VendorAuctionResponse>
) => {
  // US-059 AC2 (D-003): the farmer's customer id, as submit reads it. Absent
  // on an incomplete profile → the ban check is skipped (submit refuses then).
  const customerId = req.auth_context.app_metadata?.customer_id

  const { result } = await createAuctionWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      member_id: req.auth_context.actor_id,
      customer_id: typeof customerId === "string" ? customerId : undefined,
      fee_category_id: req.validatedBody.fee_category_id,
      // Workflow input crosses steps as JSON, so dates go as ISO strings.
      start_at: req.validatedBody.start_at.toISOString(),
      end_at: req.validatedBody.end_at.toISOString(),
      delivery_method: req.validatedBody.delivery_method,
      lots: req.validatedBody.lots,
    },
  })

  res.status(201).json({
    auction: {
      ...toVendorAuction(result.auction),
      lots: result.lots.map((lot: Record<string, unknown>) => toVendorLot(lot)),
    },
  })
}
