import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
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
import { NO_CERTIFICATE_ISSUER } from "../../../utils/koi-lot-fields"

// US-040 AC3 (D-046, D-050). The storefront is lot-centric: `/lelang` lists
// lots and `/lelang/[id]` takes a lot id, so these are the public reads. No
// customer identity: publishable key only, the pages are public.

export type StoreLot = {
  id: string
  // US-096 AC1: 1-based position in its auction, see lotNumbers. The client
  // renders it as `Lot #07`.
  lot_number: number
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
  // US-105 (D-081): the koi's fields. null on a lot created before the story
  // or when the farmer left the field empty (AC6). `certificate_issuer` is
  // D-081's "no certificate" label when `has_certificate` is false.
  variety: string | null
  size_cm: number | null
  age: string | null
  sex: string | null
  has_certificate: boolean | null
  certificate_issuer: string | null
  pond_origin: string | null
  breeder_notes: string | null
  video_url: string | null
  auction: {
    id: string
    status: string
    start_at: string
    end_at: string
    // The final fee: the override when set (D-032).
    join_fee: number
    // US-096 AC3 / US-015 AC2: the window copied from platform settings when
    // the auction was created, the one place-bid extends by.
    extend_window_minutes: number
    delivery_method: string
    category: { id: string; name: string } | null
    // D-039 / D-046: id, name and handle only. Never any other seller field.
    seller: { id: string; name: string; handle: string } | null
    // D-061: the farmer's YouTube/Instagram live link, null when unset.
    live_stream_url: string | null
  }
}

// US-111 T-111.6 (D-070, D-080): the list adds whether *this viewer* joined
// the lot. A per-auction join made before US-111 counts for every lot of that
// auction. The detail keeps the plain StoreLot; only the list carries it.
export type StoreLotListItem = StoreLot & { joined: boolean }

export type StoreLotsResponse = {
  lots: StoreLotListItem[]
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
  // US-105 AC4 (D-081).
  "variety",
  "size_cm",
  "age",
  "sex",
  "has_certificate",
  "certificate_issuer",
  "pond_origin",
  "breeder_notes",
  "video_url",
  "auction.id",
  "auction.status",
  "auction.start_at",
  "auction.end_at",
  "auction.join_fee",
  "auction.fee_override_join_fee",
  "auction.extend_window_minutes",
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
  categories: Map<string, { id: string; name: string }>,
  lotNumbers: Map<string, number>
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
    lot_number: lotNumbers.get(row.id as string) as number,
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
    // US-105 AC1/AC6 (D-081): D-081's label when there is no certificate.
    variety: (row.variety as string | null) ?? null,
    size_cm: (row.size_cm as number | null) ?? null,
    age: (row.age as string | null) ?? null,
    sex: (row.sex as string | null) ?? null,
    has_certificate: (row.has_certificate as boolean | null) ?? null,
    certificate_issuer:
      row.has_certificate === false
        ? NO_CERTIFICATE_ISSUER
        : ((row.certificate_issuer as string | null) ?? null),
    pond_origin: (row.pond_origin as string | null) ?? null,
    breeder_notes: (row.breeder_notes as string | null) ?? null,
    video_url: (row.video_url as string | null) ?? null,
    auction: {
      id: auction.id as string,
      status: auction.status as string,
      start_at: new Date(auction.start_at as string).toISOString(),
      end_at: new Date(auction.end_at as string).toISOString(),
      join_fee: (auction.fee_override_join_fee as number | null) ?? Number(auction.join_fee),
      extend_window_minutes: Number(auction.extend_window_minutes),
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
export const toStoreLots = async (
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
  const numbers = await lotNumbers(scope, rows)
  return rows.map((row) => toStoreLot(row, byId, numbers))
}

// US-096 AC1: the lot number is the lot's 1-based position among ALL lots of
// its auction (cancelled ones included), ordered by `created_at`, then `id`.
// Derived on every read, no column. It must never change once public: lots are
// added or removed only while the auction is `draft` (D-032) and only
// scheduled/live/closed lots are public (D-046), so the set is fixed before
// anyone sees a number. Don't change this rule or the ordering keys.
export const lotNumbers = async (
  scope: MedusaContainer,
  rows: StoreLotRow[]
): Promise<Map<string, number>> => {
  const auctionIds = [
    ...new Set(
      rows.map((row) => (row.auction as Record<string, unknown>)?.id as string)
    ),
  ]
  if (!auctionIds.length) return new Map()
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot",
    fields: ["id", "created_at", "auction.id"],
    filters: { auction: { id: auctionIds } },
  })
  const siblings = (
    data as { id: string; created_at: string | Date; auction: { id: string } }[]
  ).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
  const next = new Map<string, number>()
  const numbers = new Map<string, number>()
  for (const lot of siblings) {
    const n = (next.get(lot.auction.id) ?? 0) + 1
    next.set(lot.auction.id, n)
    numbers.set(lot.id, n)
  }
  return numbers
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

// US-111 T-111.6 (D-080): every lot this customer can already join, directly
// (`lot_participant`) or through a pre-US-111 auction-wide row. Filtering on
// this id set inside the page query keeps `count`/`limit`/`offset` correct.
const joinedLotIds = async (
  scope: MedusaContainer,
  customerId: string
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: lotRows }, { data: auctionRows }] = await Promise.all([
    query.graph({
      entity: "lot_participant",
      fields: ["lot_id"],
      filters: { customer_id: customerId },
    }),
    query.graph({
      entity: "auction_participant",
      fields: ["auction_id"],
      filters: { customer_id: customerId },
    }),
  ])
  const auctionIds = [
    ...new Set(
      (auctionRows as { auction_id: string }[]).map((row) => row.auction_id)
    ),
  ]
  const { data: legacyLots } = auctionIds.length
    ? await query.graph({
        entity: "lot",
        fields: ["id"],
        filters: { auction: { id: auctionIds } },
      })
    : { data: [] }
  return [
    ...new Set([
      ...(lotRows as { lot_id: string }[]).map((row) => row.lot_id),
      ...(legacyLots as { id: string }[]).map((row) => row.id),
    ]),
  ]
}

// Two batched reads per page, never one per lot. Guests get `false` with no
// query. `joined` is the D-080 carry-over: a lot row or its auction's row.
const withJoined = async (
  scope: MedusaContainer,
  lots: StoreLot[],
  customerId: string | undefined
): Promise<StoreLotListItem[]> => {
  if (!customerId) return lots.map((lot) => ({ ...lot, joined: false }))
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const lotIds = lots.map((lot) => lot.id)
  const auctionIds = [...new Set(lots.map((lot) => lot.auction.id))]
  const [{ data: lotRows }, { data: auctionRows }] = lotIds.length
    ? await Promise.all([
        query.graph({
          entity: "lot_participant",
          fields: ["lot_id"],
          filters: { lot_id: lotIds, customer_id: customerId },
        }),
        query.graph({
          entity: "auction_participant",
          fields: ["auction_id"],
          filters: { auction_id: auctionIds, customer_id: customerId },
        }),
      ])
    : [{ data: [] }, { data: [] }]
  const joinedLots = new Set(
    (lotRows as { lot_id: string }[]).map((row) => row.lot_id)
  )
  const joinedAuctions = new Set(
    (auctionRows as { auction_id: string }[]).map((row) => row.auction_id)
  )
  return lots.map((lot) => ({
    ...lot,
    joined: joinedLots.has(lot.id) || joinedAuctions.has(lot.auction.id),
  }))
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
  const {
    limit = 20,
    offset = 0,
    status,
    variety,
    size_min,
    size_max,
    certificate,
    has_video,
    joined,
  } = req.validatedQuery
  const openStatuses = PUBLIC_AUCTION_STATUSES.filter((s) => s !== "closed")
  // The store auth middleware is `allowUnauthenticated`, so a customer token
  // is optional: present means the viewer is signed in, absent means guest.
  const customerId = req.auth_context?.actor_id as string | undefined

  // US-105 AC4 (D-081). Old lots with a null column match none of the koi
  // filters; with no filter they still list (AC6).
  const filters: Record<string, unknown> = {
    auction: { status: status ?? openStatuses },
  }
  if (variety?.length) filters.variety = variety
  if (size_min !== undefined || size_max !== undefined) {
    filters.size_cm = {
      ...(size_min !== undefined ? { $gte: size_min } : {}),
      ...(size_max !== undefined ? { $lte: size_max } : {}),
    }
  }
  if (certificate !== undefined) filters.has_certificate = certificate === "true"
  if (has_video !== undefined) {
    filters.video_url = has_video === "true" ? { $ne: null } : null
  }

  // US-111 T-111.6 (D-080): `joined=true` is the viewer's own lots. A guest
  // can't have joined anything, so it is a 401, not an empty page.
  if (joined === "true") {
    if (!customerId) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
    }
    filters.id = { $in: await joinedLotIds(req.scope, customerId) }
  }

  const { lots, count } = await getPublicLots(
    req.scope,
    filters,
    limit,
    offset,
    status === "closed" ? "DESC" : "ASC"
  )

  res.json({
    lots: await withJoined(req.scope, lots, customerId),
    count,
    limit,
    offset,
  })
}
