import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  PUBLIC_AUCTION_STATUSES,
  type StoreGetLotsParamsType,
} from "./validators"
import { maskBidder } from "../../../utils/mask"

// US-040 AC3 (D-046, D-050). The storefront is lot-centric: `/lelang` lists
// lots and `/lelang/[id]` takes a lot id, so these are the public reads. No
// customer identity: publishable key only, the pages are public.

export type StoreLot = {
  id: string
  title: string | null
  description: string | null
  photos: string[]
  ob: number
  kb: number
  // null when the lot is cancelled (D-050).
  current_price: number | null
  end_time: string
  // null while the lot is open, and when cancelled.
  final_price: number | null
  // null while open and when cancelled; true for won/paid/shipped/delivered/
  // claimed, false for unsold.
  sold: boolean | null
  cancelled: boolean
  // US-044 (D-051): computed from the rows on every read, never stored.
  bid_count: number
  auction: {
    id: string
    status: string
    start_at: string
    end_at: string
    // The final fee: the override when set (D-032).
    join_fee: number
    delivery_method: string
    category: { id: string; name: string } | null
    // D-039 / D-046: id, name and handle only. Never any other seller field.
    seller: { id: string; name: string; handle: string } | null
    // D-061: the farmer's YouTube/Instagram live link, null when unset.
    live_stream_url: string | null
  }
}

export type StoreLotsResponse = {
  lots: StoreLot[]
  count: number
  limit: number
  offset: number
}

// US-044 (D-051): the detail-only bid history. Exactly these three keys, never
// a bid id, customer id or name.
export type StoreBid = { bidder: string; amount: number; created_at: string }

export type StoreLotDetail = StoreLot & { bids: StoreBid[] }

export type StoreLotDetailResponse = { lot: StoreLotDetail }

// The raw lot status (`won`, `paid`, …) stays private: it would tell who won.
// `bids.*` rides along for `bid_count`; the feed mapper never re-emits a row.
export const STORE_LOT_FIELDS = [
  "id",
  "bids.id",
  "bids.customer_id",
  "bids.amount",
  "bids.created_at",
  // US-072 T-072.1c (AC2): removed rows are dropped from the count and the
  // detail history; the field itself is never re-emitted.
  "bids.removed_at",
  "ob",
  "kb",
  "current_price",
  "end_time",
  "final_price",
  "status",
  "auction.id",
  "auction.status",
  "auction.start_at",
  "auction.end_at",
  "auction.join_fee",
  "auction.fee_override_join_fee",
  "auction.delivery_method",
  "auction.fee_category_id",
  "auction.seller.id",
  "auction.seller.name",
  "auction.seller.handle",
  "auction.live_stream_url",
  "product.title",
  "product.description",
  "product.images.url",
]

const SOLD_STATUSES = ["won", "paid", "shipped", "delivered", "claimed"]

type StoreLotRow = Record<string, unknown>

const toStoreLot = (
  row: StoreLotRow,
  categories: Map<string, { id: string; name: string }>
): StoreLot => {
  const auction = (row.auction ?? {}) as Record<string, unknown>
  const seller = auction.seller as
    | { id: string; name: string; handle: string }
    | null
    | undefined
  const product = row.product as
    | {
        title?: string | null
        description?: string | null
        images?: { url: string }[] | null
      }
    | null
    | undefined
  const status = row.status as string
  const cancelled = status === "cancelled"
  const bids = (row.bids ?? []) as { id: string; removed_at: string | null }[]

  return {
    id: row.id as string,
    title: product?.title ?? null,
    description: product?.description ?? null,
    photos: (product?.images ?? []).map((image) => image.url),
    ob: Number(row.ob),
    kb: Number(row.kb),
    current_price: cancelled ? null : Number(row.current_price),
    end_time: new Date(row.end_time as string).toISOString(),
    final_price: cancelled ? null : ((row.final_price as number | null) ?? null),
    sold: cancelled
      ? null
      : SOLD_STATUSES.includes(status)
        ? true
        : status === "unsold"
          ? false
          : null,
    cancelled,
    // D-050: a cancelled lot shows no bids, so neither the count nor the rows.
    // US-072 AC2: a removed bid never counts.
    bid_count: cancelled
      ? 0
      : bids.filter((bid) => bid.removed_at == null).length,
    auction: {
      id: auction.id as string,
      status: auction.status as string,
      start_at: new Date(auction.start_at as string).toISOString(),
      end_at: new Date(auction.end_at as string).toISOString(),
      join_fee: (auction.fee_override_join_fee as number | null) ?? Number(auction.join_fee),
      delivery_method: auction.delivery_method as string,
      category: categories.get(auction.fee_category_id as string) ?? null,
      seller: seller
        ? { id: seller.id, name: seller.name, handle: seller.handle }
        : null,
      live_stream_url: (auction.live_stream_url as string | null) ?? null,
    },
  }
}

// No link from auction to the fee table, so the categories are one batched
// read, same idea as toAdminAuctions.
const toStoreLots = async (
  scope: MedusaContainer,
  rows: StoreLotRow[]
): Promise<StoreLot[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const ids = [
    ...new Set(
      rows
        .map((row) => (row.auction as Record<string, unknown>)?.fee_category_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ]
  const { data: categories } = ids.length
    ? await query.graph({
        entity: "fee_category",
        fields: ["id", "name"],
        filters: { id: ids },
      })
    : { data: [] }
  const byId = new Map(categories.map((c) => [c.id, { id: c.id, name: c.name }]))
  return rows.map((row) => toStoreLot(row, byId))
}

export const getPublicLots = async (
  scope: MedusaContainer,
  filters: Record<string, unknown>,
  limit: number,
  offset: number,
  order: "ASC" | "DESC"
): Promise<{ lots: StoreLot[]; count: number; rows: StoreLotRow[] }> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "lot",
    fields: STORE_LOT_FIELDS,
    filters,
    pagination: { skip: offset, take: limit, order: { end_time: order } },
  })
  return {
    lots: await toStoreLots(scope, data),
    count: metadata?.count ?? 0,
    rows: data,
  }
}

// US-044 (D-051). One batched read of the bidders' first names (soft reference,
// no link), then mask. The customer row never leaves the server.
// ponytail: no cap or pagination — fine for an MVP lot's few hundred bids; add a
// limit plus `has_more` when a lot can carry more.
export const toStoreBids = async (
  scope: MedusaContainer,
  rows: {
    id: string
    customer_id: string
    amount: number
    created_at: string
    removed_at?: string | null
  }[]
): Promise<StoreBid[]> => {
  // US-072 AC2: a removed bid is not part of the history shown to customers.
  const visible = rows.filter((bid) => bid.removed_at == null)
  const ids = [...new Set(visible.map((b) => b.customer_id))]
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = ids.length
    ? await query.graph({
        entity: "customer",
        fields: ["id", "first_name"],
        filters: { id: ids },
      })
    : { data: [] }
  const names = new Map(
    (customers as { id: string; first_name?: string | null }[]).map((c) => [
      c.id,
      c.first_name,
    ])
  )

  return [...visible]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime() || b.id.localeCompare(a.id)
    )
    .map((bid) => ({
      bidder: maskBidder(names.get(bid.customer_id), bid.customer_id),
      amount: Number(bid.amount),
      created_at: new Date(bid.created_at).toISOString(),
    }))
}

// No status → the open feed: scheduled + live, soonest end first. status=closed
// → closed auctions' lots, newest result first. Anything else is a 400 (D-046).
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, StoreGetLotsParamsType>,
  res: MedusaResponse<StoreLotsResponse>
) => {
  const { limit = 20, offset = 0, status } = req.validatedQuery
  const openStatuses = PUBLIC_AUCTION_STATUSES.filter((s) => s !== "closed")
  const { lots, count } = await getPublicLots(
    req.scope,
    { auction: { status: status ?? openStatuses } },
    limit,
    offset,
    status === "closed" ? "DESC" : "ASC"
  )

  res.json({ lots, count, limit, offset })
}
