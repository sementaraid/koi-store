import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import type { LotStatus } from "../../../modules/auction/models/lot"
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
}

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

export const toWonLot = (row: Record<string, unknown>): WonLot => {
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
  }
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

  res.json({
    lots: data.map(toWonLot),
    count: metadata?.count ?? 0,
    limit,
    offset,
    has_shipping_address,
  })
}
