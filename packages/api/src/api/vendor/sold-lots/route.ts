import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { assertSellerNotTerminated } from "../../../workflows/steps/sold-lot"
import { PAY_WINDOW_MS } from "../../../utils/pay-window"
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

// US-058 T-058.1: the farmer's own non-payment report on this lot, if any.
// `reported_at` is the row's created_at; nothing else about it is exposed.
export type SoldLotUnpaid = { reported_at: string }

// US-110 (AC5, D-078): the farmer's own payout state for this lot. Gross, the
// typed fee and the net are shown; the bank reference is the admin's record and
// no winner/customer field is exposed. Null before the admin confirms the
// winner's payment (`won`).
export type SoldLotPayout = {
  status: "pending" | "due" | "paid" | "cancelled"
  gross_amount: number
  bank_fee: number | null
  net_amount: number | null
  due_reason: string | null
  due_at: string | null
  paid_at: string | null
  transfer_reference: string | null
}

export type SoldLot = {
  id: string
  status: string
  final_price: number | null
  closed_at: string | null
  // D-072: set when an admin confirms the winner's transfer; null before.
  paid_at: string | null
  // D-058: closed_at + 24 h, ISO. null when the lot has no closed_at.
  pay_by: string | null
  // US-058: null until the farmer reports the winner.
  unpaid: SoldLotUnpaid | null
  // US-052 T-052.1: null for self-delivery, and until the lot is shipped.
  tracking_number: string | null
  // D-072: saved when the farmer ships and when the winner marks it
  // delivered; null until each step is reached.
  shipped_at: string | null
  delivered_at: string | null
  auction: { id: string; delivery_method: string }
  product: { title: string | null; thumbnail: string | null }
  // D-052: name only. No phone, email or customer id, ever.
  winner: { name: string; address: SoldLotAddress | null }
  // US-110 (AC5): null while the lot is `won` (the winner has not paid).
  payout: SoldLotPayout | null
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
  "paid_at",
  "tracking_number",
  "shipped_at",
  "delivered_at",
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

// US-058 T-058.1: the page's reports in one query, keyed by lot id.
const reportsByLot = async (
  scope: MedusaContainer,
  lotIds: string[]
): Promise<Map<string, SoldLotUnpaid>> => {
  if (!lotIds.length) return new Map()
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot_report",
    fields: ["id", "lot_id", "created_at"],
    filters: { lot_id: lotIds },
  })
  return new Map(
    (data as { lot_id: string; created_at: Date | string }[]).map((row) => [
      row.lot_id,
      { reported_at: new Date(row.created_at).toISOString() },
    ])
  )
}

// US-110 (AC5): the page's payouts in one query, keyed by lot id.
const payoutsByLot = async (
  scope: MedusaContainer,
  lotIds: string[]
): Promise<Map<string, SoldLotPayout>> => {
  if (!lotIds.length) return new Map()
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot_payout",
    fields: [
      "id",
      "lot_id",
      "status",
      "gross_amount",
      "bank_fee",
      "due_reason",
      "due_at",
      "paid_at",
      "transfer_reference",
    ],
    filters: { lot_id: lotIds },
  })
  return new Map(
    (
      data as {
        lot_id: string
        status: SoldLotPayout["status"]
        gross_amount: number
        bank_fee: number | null
        due_reason: string | null
        due_at: Date | string | null
        paid_at: Date | string | null
        transfer_reference: string | null
      }[]
    ).map((row) => {
      const gross = Number(row.gross_amount)
      const fee = row.bank_fee === null ? null : Number(row.bank_fee)
      return [
        row.lot_id,
        {
          status: row.status,
          gross_amount: gross,
          bank_fee: fee,
          net_amount: fee === null ? null : Math.max(0, gross - fee),
          due_reason: row.due_reason ?? null,
          due_at: row.due_at ? new Date(row.due_at).toISOString() : null,
          paid_at: row.paid_at ? new Date(row.paid_at).toISOString() : null,
          transfer_reference: row.transfer_reference ?? null,
        },
      ]
    })
  )
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
  const lotIds = rows.map((row) => row.id as string)
  const [winners, reports, payouts] = await Promise.all([
    winnersById(scope, winnerIds),
    reportsByLot(scope, lotIds),
    payoutsByLot(scope, lotIds),
  ])

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
    const closedAt = row.closed_at
      ? new Date(row.closed_at as string).toISOString()
      : null
    return {
      id: row.id as string,
      status: row.status as string,
      final_price: (row.final_price as number | null) ?? null,
      closed_at: closedAt,
      paid_at: row.paid_at
        ? new Date(row.paid_at as string).toISOString()
        : null,
      pay_by:
        closedAt === null
          ? null
          : new Date(new Date(closedAt).getTime() + PAY_WINDOW_MS).toISOString(),
      unpaid: reports.get(row.id as string) ?? null,
      tracking_number: (row.tracking_number as string | null) ?? null,
      shipped_at: row.shipped_at
        ? new Date(row.shipped_at as string).toISOString()
        : null,
      delivered_at: row.delivered_at
        ? new Date(row.delivered_at as string).toISOString()
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
      payout: payouts.get(row.id as string) ?? null,
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
