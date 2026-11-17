import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import type { LotStatus } from "../../../modules/auction/models/lot"
import { readClaimWindowHours } from "../../../workflows/steps/claim"
import type { StoreGetWonLotsParamsType } from "./validators"

type Query = Omit<RemoteQueryFunction, symbol>

// US-051 T-051.6 / US-053 T-053.2 (AC1 reading, D-046, D-052, D-056): the
// winner's own won-and-later lots. The public `GET /store/lots/:id`
// deliberately hides the winner, so the signed-in winner reads their lots
// here. No farmer contact (no bank, holder name or phone): T-051.6's
// no-contact version. The farmer-contact reveal stays parked with D-044.
// `seller` carries only id and name (farm name) — never phone or payment
// details. `has_shipping_address` is a caller-level flag, not per lot: the
// winner's default shipping address is the same address every farmer ships
// to (D-056).

// US-054 T-054.1b: the caller's own claim on the lot, never its file key or
// URL (D-018). `opened_at` is the claim row's created_at.
export type WonLotClaim = {
  id: string
  status: string
  remedy: string
  opened_at: string
  has_video: boolean
}

// Per-row values the shared mapper can't get from the lot row alone.
export type WonLotExtras = {
  // delivered_at + claim_window_hours; null unless the lot is `delivered`.
  claim_window_ends_at: string | null
  claim: WonLotClaim | null
}

export type WonLot = {
  id: string
  status: string
  final_price: number | null
  closed_at: string | null
  tracking_number: string | null
  delivered_at: string | null
  auction: { id: string; delivery_method: string }
  product: { title: string | null; thumbnail: string | null }
  seller: { id: string; name: string }
} & WonLotExtras

export type StoreWonLotsResponse = {
  lots: WonLot[]
  count: number
  limit: number
  offset: number
  has_shipping_address: boolean
}

export type StoreWonLotResponse = {
  lot: WonLot
  has_shipping_address: boolean
}

// The caller's own lots only, so `winner_customer_id` is used as a filter, not
// selectable. `auction.seller.*` is the farm name shown on the row — never
// `.phone` or `.payment_details`.
export const WON_LOT_FIELDS = [
  "id",
  "status",
  "final_price",
  "closed_at",
  "tracking_number",
  "delivered_at",
  "auction.id",
  "auction.delivery_method",
  "auction.seller.id",
  "auction.seller.name",
  "product.title",
  "product.thumbnail",
]

// Same list as the farmer's sold lots: a closed lot with a winner (D-035).
export const WON_LOT_STATUSES = [
  "won",
  "paid",
  "shipped",
  "delivered",
  "claimed",
] as const satisfies readonly LotStatus[]

const iso = (value: unknown): string | null =>
  value ? new Date(value as string).toISOString() : null

export const toWonLot = (
  row: Record<string, unknown>,
  extras: WonLotExtras
): WonLot => {
  const auction = (row.auction ?? {}) as Record<string, unknown>
  const seller = auction.seller as
    | { id?: string; name?: string }
    | null
    | undefined
  const product = row.product as
    | { title?: string | null; thumbnail?: string | null }
    | null
    | undefined
  return {
    id: row.id as string,
    status: row.status as string,
    final_price: (row.final_price as number | null) ?? null,
    closed_at: iso(row.closed_at),
    tracking_number: (row.tracking_number as string | null) ?? null,
    delivered_at: iso(row.delivered_at),
    auction: {
      id: auction.id as string,
      delivery_method: auction.delivery_method as string,
    },
    product: {
      title: product?.title ?? null,
      thumbnail: product?.thumbnail ?? null,
    },
    seller: {
      id: seller?.id as string,
      name: (seller?.name ?? "") as string,
    },
    ...extras,
  }
}

// US-054 T-054.1b: `claim_window_ends_at` and the caller's own `claim`, read
// for a whole page in one query (plus the shared settings read), never per
// row. `video_file_key` is never selected (D-018); every claim row has one
// (POST requires the upload), so `has_video` is true by construction.
export const readWonLotExtras = async (
  query: Query,
  rows: Record<string, unknown>[],
  customerId: string
): Promise<Map<string, WonLotExtras>> => {
  const ids = rows.map((row) => row.id as string)
  if (!ids.length) return new Map()

  const [windowHours, { data: claims }] = await Promise.all([
    readClaimWindowHours(query),
    query.graph({
      entity: "claim",
      fields: ["id", "lot_id", "status", "remedy", "created_at"],
      filters: { lot_id: ids, customer_id: customerId },
    }),
  ])

  const claimByLot = new Map<string, WonLotClaim>()
  for (const claim of claims as {
    id: string
    lot_id: string
    status: string
    remedy: string
    created_at: Date | string
  }[]) {
    claimByLot.set(claim.lot_id, {
      id: claim.id,
      status: claim.status,
      remedy: claim.remedy,
      opened_at: new Date(claim.created_at).toISOString(),
      has_video: true,
    })
  }

  const byId = new Map<string, WonLotExtras>()
  for (const row of rows) {
    const deliveredAt = iso(row.delivered_at)
    const endsAt =
      row.status === "delivered" && deliveredAt
        ? new Date(
            new Date(deliveredAt).getTime() + windowHours * 60 * 60 * 1000
          ).toISOString()
        : null
    byId.set(row.id as string, {
      claim_window_ends_at: endsAt,
      claim: claimByLot.get(row.id as string) ?? null,
    })
  }
  return byId
}

// D-056: whether the caller has a default shipping address. One query,
// `is_default_shipping` only — never `address_1`/city/etc, which stay the
// farmer-reveal's job, not this route's.
export const readHasShippingAddress = async (
  query: Query,
  customerId: string
): Promise<boolean> => {
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "addresses.is_default_shipping"],
    filters: { id: customerId },
  })
  const addresses =
    (customer as { addresses?: { is_default_shipping: boolean }[] } | undefined)
      ?.addresses ?? []
  return addresses.some((a) => a.is_default_shipping)
}

// US-051 T-051.6: the caller's won-and-later lots, newest closed first.
// Customer token only (middlewares.ts); identity from auth_context.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, StoreGetWonLotsParamsType>,
  res: MedusaResponse<StoreWonLotsResponse>
) => {
  const customerId = req.auth_context.actor_id
  const { limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [{ data, metadata }, has_shipping_address] = await Promise.all([
    query.graph({
      entity: "lot",
      fields: WON_LOT_FIELDS,
      filters: {
        winner_customer_id: customerId,
        status: [...WON_LOT_STATUSES],
      },
      pagination: { skip: offset, take: limit, order: { closed_at: "DESC" } },
    }),
    readHasShippingAddress(query, customerId),
  ])

  // One query over the page's ids, not one per row (T-054.1b).
  const rowExtras = await readWonLotExtras(query, data, customerId)

  res.json({
    lots: data.map((row) =>
      toWonLot(
        row,
        rowExtras.get(row.id as string) ?? {
          claim_window_ends_at: null,
          claim: null,
        }
      )
    ),
    count: metadata?.count ?? 0,
    limit,
    offset,
    has_shipping_address,
  })
}
