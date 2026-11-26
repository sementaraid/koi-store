import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import type {
  LotStatus,
  PaymentProofStatus,
} from "../../../modules/auction/models/lot"
import { PAY_WINDOW_MS } from "../../../utils/pay-window"
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

// US-057 T-057.1: the caller's own rating on the lot, if any. Never the rater's
// customer id (D-042/D-045).
export type WonLotRating = {
  id: string
  stars: number
  comment: string | null
  created_at: string
}

// US-110 T-110.1 (AC2, D-018): the arrival proof state only. The private file
// key stays on the server; the winner gets whether one exists and its time.
export type WonLotArrivalProof = {
  has_file: boolean
  uploaded_at: string | null
}

// Per-row values the shared mapper can't get from the lot row alone.
export type WonLotExtras = {
  // delivered_at + claim_window_hours; null unless the lot is `delivered`.
  claim_window_ends_at: string | null
  claim: WonLotClaim | null
  // US-057 T-057.1: the caller's rating on this lot, or null.
  rating: WonLotRating | null
  // US-110 T-110.1: the winner's arrival proof, no key or URL.
  arrival_proof: WonLotArrivalProof
}

// US-109 T-109.1 (AC2, D-077): the caller's transfer-proof state. Never the
// private file key or a URL (D-018) — only whether an image exists.
export type WonLotPaymentProof = {
  status: PaymentProofStatus
  has_image: boolean
  // The admin's rejection reason, or null.
  reason: string | null
  uploaded_at: string | null
}

export type WonLot = {
  id: string
  status: string
  final_price: number | null
  closed_at: string | null
  // D-072: set when an admin confirms the winner's transfer; null before.
  paid_at: string | null
  // D-058: closed_at + 24 h, ISO. null when the lot has no closed_at.
  pay_by: string | null
  tracking_number: string | null
  // D-072: saved when the farmer ships and when the winner marks it
  // delivered; null until each step is reached.
  shipped_at: string | null
  delivered_at: string | null
  claim_window_ends_at: string | null
  claim: WonLotClaim | null
  // US-057 T-057.1 AC1: null until the winner rates this lot.
  rating: WonLotRating | null
  // US-109 T-109.1: the transfer proof state, no key or URL (D-018).
  proof: WonLotPaymentProof
  // US-110 T-110.1: the "arrived healthy" proof state, no key or URL (D-018).
  arrival_proof: WonLotArrivalProof
  auction: { id: string; delivery_method: string }
  product: { title: string | null; thumbnail: string | null }
  // US-108 (D-068): the winner pays the company account, so no farmer bank
  // field, masked or full.
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
// `.phone` or `.payment_details` (D-052, D-068).
export const WON_LOT_FIELDS = [
  "id",
  "status",
  "final_price",
  "closed_at",
  "paid_at",
  "tracking_number",
  "shipped_at",
  "delivered_at",
  // US-109: selected server-side only; `toWonLot` emits `has_image`, never the
  // key itself (D-018).
  "payment_proof_file_key",
  "payment_proof_status",
  "payment_proof_reason",
  "payment_proof_uploaded_at",
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

// US-109 T-109.1 (D-018, D-077): proof state only. The file key stays on the
// server.
export const toWonLotPaymentProof = (
  row: Record<string, unknown>
): WonLotPaymentProof => ({
  status: (row.payment_proof_status as PaymentProofStatus) ?? "none",
  has_image: !!row.payment_proof_file_key,
  reason: (row.payment_proof_reason as string | null) ?? null,
  uploaded_at: iso(row.payment_proof_uploaded_at),
})

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
    paid_at: iso(row.paid_at),
    pay_by: row.closed_at
      ? new Date(new Date(row.closed_at as string).getTime() + PAY_WINDOW_MS)
          .toISOString()
      : null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    shipped_at: iso(row.shipped_at),
    delivered_at: iso(row.delivered_at),
    proof: toWonLotPaymentProof(row),
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

// US-057 T-057.1: the caller's own rating for a whole page in one query, never
// per row. Only the four display fields, never `customer_id` (D-042/D-045).
export const readWonLotExtras = async (
  query: Query,
  rows: Record<string, unknown>[],
  customerId: string
): Promise<Map<string, WonLotExtras>> => {
  const ids = rows.map((row) => row.id as string)
  if (!ids.length) return new Map()

  const [
    windowHours,
    { data: claims },
    { data: ratings },
    { data: payouts },
  ] = await Promise.all([
    readClaimWindowHours(query),
    query.graph({
      entity: "claim",
      fields: ["id", "lot_id", "status", "remedy", "created_at", "video_deleted_at"],
      filters: { lot_id: ids, customer_id: customerId },
    }),
    query.graph({
      entity: "farmer_rating",
      fields: ["id", "lot_id", "stars", "comment", "created_at"],
      filters: { lot_id: ids, customer_id: customerId },
    }),
    // US-110 T-110.1 (AC2): proof state only; the key is never selected.
    query.graph({
      entity: "lot_payout",
      fields: [
        "id",
        "lot_id",
        "arrival_proof_file_key",
        "arrival_proof_uploaded_at",
      ],
      filters: { lot_id: ids },
    }),
  ])

  const claimByLot = new Map<string, WonLotClaim>()
  for (const claim of claims as {
    id: string
    lot_id: string
    status: string
    remedy: string
    created_at: Date | string
    video_deleted_at: Date | string | null
  }[]) {
    claimByLot.set(claim.lot_id, {
      id: claim.id,
      status: claim.status,
      remedy: claim.remedy,
      opened_at: new Date(claim.created_at).toISOString(),
      // US-061 (AC1): false once the cleanup job deleted the private file.
      has_video: claim.video_deleted_at === null,
    })
  }

  const ratingByLot = new Map<string, WonLotRating>()
  for (const rating of ratings as {
    id: string
    lot_id: string
    stars: number
    comment: string | null
    created_at: Date | string
  }[]) {
    ratingByLot.set(rating.lot_id, {
      id: rating.id,
      stars: rating.stars,
      comment: rating.comment ?? null,
      created_at: new Date(rating.created_at).toISOString(),
    })
  }

  const byId = new Map<string, WonLotExtras>()
  const payoutByLot = new Map<string, WonLotArrivalProof>()
  for (const payout of payouts as {
    lot_id: string
    arrival_proof_file_key: string | null
    arrival_proof_uploaded_at: Date | string | null
  }[]) {
    payoutByLot.set(payout.lot_id, {
      has_file: !!payout.arrival_proof_file_key,
      uploaded_at: iso(payout.arrival_proof_uploaded_at),
    })
  }
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
      rating: ratingByLot.get(row.id as string) ?? null,
      arrival_proof: payoutByLot.get(row.id as string) ?? {
        has_file: false,
        uploaded_at: null,
      },
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
          rating: null,
          arrival_proof: { has_file: false, uploaded_at: null },
        }
      )
    ),
    count: metadata?.count ?? 0,
    limit,
    offset,
    has_shipping_address,
  })
}
