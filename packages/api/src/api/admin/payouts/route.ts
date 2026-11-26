import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type {
  LotPayoutStatus,
  PayoutDueReason,
  PayoutRefundKind,
} from "../../../modules/payout/models/lot-payout"
import { maskName } from "../../../utils/mask"
import { payoutRefundKind } from "../../../workflows/steps/payout"
import { winnersById } from "../../vendor/claims/route"
import { lotNumbers } from "../../store/lots/route"
import type { AdminGetPayoutsParamsType } from "./validators"

// US-110 T-110.3 (AC4, D-002, D-078): the admin-koi "Pembayaran ke farm"
// queue. `due` by default, oldest due first. The winner is a masked name only
// (D-042); the farm's bank account stays behind the logged reveal
// (`/admin/farms/:id/reveal`, D-042). No file key or URL: the proof has its own
// admin-only stream route.
// Medusa's /admin auth rejects any non-admin actor before this runs.

export type AdminPayoutRefund = {
  kind: PayoutRefundKind
  amount: number
  reference: string | null
  note: string | null
  refunded_at: string
  refunded_by: string
}

export type AdminPayoutRow = {
  id: string
  lot_id: string
  gross_amount: number
  status: LotPayoutStatus
  due_reason: PayoutDueReason | null
  due_at: string | null
  has_arrival_proof: boolean
  arrival_proof_uploaded_at: string | null
  // D-078: null until the admin records the transfer.
  bank_fee: number | null
  net_amount: number | null
  paid_at: string | null
  paid_by: string | null
  transfer_reference: string | null
  note: string | null
  refund: AdminPayoutRefund | null
}

export type AdminPayout = AdminPayoutRow & {
  lot_number: number | null
  title: string | null
  farm: { id: string; name: string }
  winner: { name: string } | null
  // A due payout is unpaid past its due date. There is no separate grace
  // period in D-069/D-074, so every `due` row is flagged.
  overdue: boolean
  // AC6 / D-075: true only where `POST /admin/payouts/:id/refund` would
  // accept the refund. admin-koi hides the refund action unless this is true.
  refund_eligible: boolean
}

export type AdminPayoutsResponse = {
  payouts: AdminPayout[]
  count: number
  limit: number
  offset: number
}

export type AdminPayoutResponse = { payout: AdminPayoutRow }

type PayoutRow = {
  id: string
  lot_id: string
  seller_id: string
  gross_amount: number
  status: LotPayoutStatus
  due_reason: PayoutDueReason | null
  due_at: Date | string | null
  arrival_proof_file_key: string | null
  arrival_proof_uploaded_at: Date | string | null
  bank_fee: number | null
  paid_at: Date | string | null
  paid_by: string | null
  transfer_reference: string | null
  note: string | null
  refund_kind: PayoutRefundKind | null
  refund_amount: number | null
  refund_reference: string | null
  refund_note: string | null
  refunded_at: Date | string | null
  refunded_by: string | null
}

const iso = (value: unknown): string | null =>
  value ? new Date(value as string).toISOString() : null

// The fields every admin read uses, so one serializer serves the list and the
// pay/refund responses.
export const ADMIN_PAYOUT_FIELDS = [
  "id",
  "lot_id",
  "seller_id",
  "gross_amount",
  "status",
  "due_reason",
  "due_at",
  "arrival_proof_file_key",
  "arrival_proof_uploaded_at",
  "bank_fee",
  "paid_at",
  "paid_by",
  "transfer_reference",
  "note",
  "refund_kind",
  "refund_amount",
  "refund_reference",
  "refund_note",
  "refunded_at",
  "refunded_by",
]

export const toAdminPayoutRow = (row: PayoutRow): AdminPayoutRow => {
  const gross = Number(row.gross_amount)
  const fee = row.bank_fee === null ? null : Number(row.bank_fee)
  return {
    id: row.id,
    lot_id: row.lot_id,
    gross_amount: gross,
    status: row.status,
    due_reason: row.due_reason ?? null,
    due_at: iso(row.due_at),
    has_arrival_proof: !!row.arrival_proof_file_key,
    arrival_proof_uploaded_at: iso(row.arrival_proof_uploaded_at),
    bank_fee: fee,
    // D-078: net = gross - fee, never below 0. Null until the fee is recorded.
    net_amount: fee === null ? null : Math.max(0, gross - fee),
    paid_at: iso(row.paid_at),
    paid_by: row.paid_by ?? null,
    transfer_reference: row.transfer_reference ?? null,
    note: row.note ?? null,
    refund:
      row.refunded_at && row.refund_kind
        ? {
            kind: row.refund_kind,
            amount: Number(row.refund_amount ?? 0),
            reference: row.refund_reference ?? null,
            note: row.refund_note ?? null,
            refunded_at: new Date(row.refunded_at).toISOString(),
            refunded_by: row.refunded_by ?? "",
          }
        : null,
  }
}

type LotRow = {
  id: string
  status: string
  shipped_at: Date | string | null
  winner_customer_id: string | null
  auction?: {
    id?: string
    seller_id?: string
    seller?: { name?: string | null } | null
  } | null
  product?: { title?: string | null } | null
}

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetPayoutsParamsType>,
  res: MedusaResponse<AdminPayoutsResponse>
) => {
  const { status, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const order =
    status === "paid"
      ? { paid_at: "DESC" as const }
      : status === "due"
        ? { due_at: "ASC" as const }
        : { created_at: "ASC" as const }

  const { data, metadata } = await query.graph({
    entity: "lot_payout",
    fields: [...ADMIN_PAYOUT_FIELDS, "created_at"],
    filters: { status },
    pagination: { skip: offset, take: limit, order },
  })
  const payouts = data as unknown as PayoutRow[]

  // One lot read for the page: farm name, product title, winner and the
  // auction id used to derive `Lot #NN` (same derivation as the storefront).
  const lotIds = [...new Set(payouts.map((row) => row.lot_id))]
  const lots = new Map<string, LotRow>()
  // AC6 / D-075: the claim decides whether a delivered lot's refund applies.
  const claims = new Map<string, { status: string; remedy: string }>()
  if (lotIds.length) {
    const { data: lotData } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "status",
        "shipped_at",
        "winner_customer_id",
        "auction.id",
        "auction.seller_id",
        "auction.seller.name",
        "product.title",
      ],
      filters: { id: lotIds },
    })
    for (const lot of lotData as unknown as LotRow[]) {
      lots.set(lot.id, lot)
    }

    // One claim per lot (DB unique), so the map is exact.
    const { data: claimData } = await query.graph({
      entity: "claim",
      fields: ["id", "lot_id", "status", "remedy"],
      filters: { lot_id: lotIds },
    })
    for (const claim of claimData as unknown as {
      lot_id: string
      status: string
      remedy: string
    }[]) {
      claims.set(claim.lot_id, claim)
    }
  }

  const winners = await winnersById(
    req.scope,
    [
      ...new Set(
        [...lots.values()]
          .map((lot) => lot.winner_customer_id)
          .filter((id): id is string => typeof id === "string")
      ),
    ]
  )
  const numbers = await lotNumbers(
    req.scope,
    [...lots.values()].map((lot) => ({
      id: lot.id,
      auction: { id: lot.auction?.id ?? "" },
    })) as never
  )

  res.json({
    payouts: payouts.map((row) => {
      const lot = lots.get(row.lot_id)
      const winnerName = lot?.winner_customer_id
        ? winners.get(lot.winner_customer_id)?.name
        : undefined
      const refundable =
        lot &&
        !row.refunded_at &&
        row.status !== "paid" &&
        payoutRefundKind({
          lot,
          claim: claims.get(row.lot_id) ?? null,
        }) !== null
      return {
        ...toAdminPayoutRow(row),
        lot_number: numbers.get(row.lot_id) ?? null,
        title: lot?.product?.title ?? null,
        farm: {
          id: lot?.auction?.seller_id ?? row.seller_id,
          name: lot?.auction?.seller?.name ?? "",
        },
        winner: winnerName ? { name: maskName(winnerName) as string } : null,
        overdue: row.status === "due",
        refund_eligible: !!refundable,
      }
    }),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
