import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { assertSellerNotTerminated } from "../../../workflows/steps/sold-lot"
import {
  SOLD_LOT_STATUSES,
  type VendorGetSoldLotsParamsType,
} from "./validators"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../types/seller-context"

// D-056 mask: only `city` and `province` are sent. `address_1`, `address_2`
// and `postal_code` are never selected, so they can't leak (mask.ts keeps
// leading/trailing chars, which would leak a house number).
export type SoldLotAddress = { city: string | null; province: string | null }

export type SoldLot = {
  id: string
  status: string
  final_price: number | null
  closed_at: string | null
  auction: { id: string; delivery_method: string }
  product: { title: string | null; thumbnail: string | null }
  // D-052: name only. No phone, email or customer id, ever.
  winner: { name: string; address: SoldLotAddress | null }
}

export type VendorSoldLotsResponse = {
  lots: SoldLot[]
  count: number
  limit: number
  offset: number
}

export const SOLD_LOT_FIELDS = [
  "id",
  "status",
  "final_price",
  "closed_at",
  "winner_customer_id",
  "auction.id",
  "auction.seller_id",
  "auction.delivery_method",
  "product.title",
  "product.thumbnail",
]

type WinnerInfo = { name: string; address: SoldLotAddress | null }

// One query for the whole page, not one per row. The default shipping address
// is picked in JS: `is_default_shipping = true` is unique per customer (D-056),
// and filtering a nested relation in query.graph is not verified.
const winnersById = async (
  scope: MedusaContainer,
  ids: string[]
): Promise<Map<string, WinnerInfo>> => {
  if (!ids.length) return new Map()
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "first_name",
      "last_name",
      "addresses.is_default_shipping",
      "addresses.city",
      "addresses.province",
    ],
    filters: { id: ids },
  })

  const byId = new Map<string, WinnerInfo>()
  for (const customer of data as {
    id: string
    first_name?: string | null
    last_name?: string | null
    addresses?: {
      is_default_shipping: boolean
      city: string | null
      province: string | null
    }[]
  }[]) {
    const address =
      customer.addresses?.find((a) => a.is_default_shipping) ?? null
    byId.set(customer.id, {
      name: [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" "),
      address: address
        ? { city: address.city ?? null, province: address.province ?? null }
        : null,
    })
  }
  return byId
}

export const toSoldLots = async (
  scope: MedusaContainer,
  rows: Record<string, unknown>[]
): Promise<SoldLot[]> => {
  const winnerIds = [
    ...new Set(
      rows
        .map((row) => row.winner_customer_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ]
  const winners = await winnersById(scope, winnerIds)

  return rows.map((row) => {
    const auction = (row.auction ?? {}) as Record<string, unknown>
    const product = row.product as
      | { title?: string | null; thumbnail?: string | null }
      | null
      | undefined
    const winnerId = row.winner_customer_id as string | null
    const winner = (winnerId && winners.get(winnerId)) || {
      name: "",
      address: null,
    }
    return {
      id: row.id as string,
      status: row.status as string,
      final_price: (row.final_price as number | null) ?? null,
      closed_at: row.closed_at
        ? new Date(row.closed_at as string).toISOString()
        : null,
      auction: {
        id: auction.id as string,
        delivery_method: auction.delivery_method as string,
      },
      product: {
        title: product?.title ?? null,
        thumbnail: product?.thumbnail ?? null,
      },
      winner,
    }
  })
}

// US-051 T-051.1b (AC2, D-056): the farmer's own sold lots (won onward),
// scoped to `req.seller_context.seller_id` (D-003). Read only: no `open` gate
// (T-021.5). A terminated farm gets 403 (D-054 reading).
export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetSoldLotsParamsType>,
  res: MedusaResponse<VendorSoldLotsResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  await assertSellerNotTerminated(req.scope, sellerId)

  const limit = req.validatedQuery.limit ?? 20
  const offset = req.validatedQuery.offset ?? 0
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "lot",
    fields: SOLD_LOT_FIELDS,
    filters: {
      auction: { seller_id: sellerId },
      status: [...SOLD_LOT_STATUSES],
    },
    pagination: { skip: offset, take: limit, order: { closed_at: "DESC" } },
  })

  res.json({
    lots: await toSoldLots(req.scope, data),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
