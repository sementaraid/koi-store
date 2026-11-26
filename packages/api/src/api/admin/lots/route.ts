import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { winnersById } from "../../vendor/claims/route"
import { lotNumbers } from "../../store/lots/route"
import {
  toWonLotPaymentProof,
  type WonLotPaymentProof,
} from "../../store/won-lots/route"
import { maskName } from "../../../utils/mask"
import { PAY_WINDOW_MS } from "../../../utils/pay-window"
import type { AdminGetLotsParamsType } from "./validators"

// US-108 T-108.3a (AC5, D-002, D-068): the admin-koi "Pembayaran pemenang"
// queue. Lots in one status (`won` by default), oldest payment deadline first.
// The deadline is `closed_at + 24 h`, derived on every read — nothing stored.
// The winner's name is masked (D-042); the full name, phone, email, NIK and
// bank are never selected. `winner_customer_id` is the opaque id the admin's
// strike call needs (US-108 AC7, D-079), the same id `GET /admin/reports`
// already returns for the same action. `paid_at`/`paid_confirmed_by` (T-108.1)
// are not selected, so this route works before that migration is applied.
// Medusa's /admin auth rejects any non-admin actor before this runs.

export type AdminLotPaymentRow = {
  id: string
  // US-096 AC1: 1-based position in its auction, displayed as `Lot #NN`.
  lot_number: number
  title: string | null
  seller: { name: string }
  winner: { name: string } | null
  // US-108 AC7 (D-079): the winner's opaque id, for the admin strike call
  // (`POST /admin/strikes`) and its history. Admin-only route; never PII.
  winner_customer_id: string | null
  final_price: number | null
  closed_at: string | null
  // D-068: `closed_at + 24 h`, ISO; null when the lot has no `closed_at`.
  pay_by: string | null
  // Deadline has passed and the lot is still in the requested status.
  overdue: boolean
  // US-109 T-109.1 (AC2, D-077): the winner's proof state; no key or URL.
  proof: WonLotPaymentProof
}

export type AdminLotsResponse = {
  lots: AdminLotPaymentRow[]
  count: number
  limit: number
  offset: number
}

type LotRow = {
  id: string
  status: string
  final_price: number | null
  closed_at: Date | string | null
  winner_customer_id: string | null
  payment_proof_file_key: string | null
  payment_proof_status: string | null
  payment_proof_reason: string | null
  payment_proof_uploaded_at: Date | string | null
  product?: { title?: string | null } | null
  auction?: { seller?: { name?: string | null } | null } | null
}

const iso = (value: unknown): string | null =>
  value ? new Date(value as string).toISOString() : null

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetLotsParamsType>,
  res: MedusaResponse<AdminLotsResponse>
) => {
  const { status, overdue, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = Date.now()
  const cutoff = new Date(now - PAY_WINDOW_MS)

  const { data, metadata } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "status",
      "final_price",
      "closed_at",
      "winner_customer_id",
      "payment_proof_file_key",
      "payment_proof_status",
      "payment_proof_reason",
      "payment_proof_uploaded_at",
      "created_at",
      "auction.id",
      "auction.seller.name",
      "product.title",
    ],
    filters: {
      status,
      // `overdue=false` means "no filter"; only `true` narrows the list.
      ...(overdue === "true" ? { closed_at: { $lt: cutoff } } : {}),
    },
    pagination: {
      skip: offset,
      take: limit,
      order: { closed_at: "ASC", id: "ASC" },
    },
  })
  const rows = data as unknown as (LotRow & { created_at: Date | string })[]

  // One batched name read for the page's winners, no per-row query. The full
  // name stays on the server; the response carries the mask only (D-042).
  const winners = await winnersById(req.scope, [
    ...new Set(
      rows
        .map((row) => row.winner_customer_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ])
  // Same derivation as `GET /store/lots`, so the admin's `Lot #NN` is the one
  // the customer sees.
  const numbers = await lotNumbers(req.scope, rows)

  res.json({
    lots: rows.map((row) => {
      const closedAt = iso(row.closed_at)
      const payBy = closedAt
        ? new Date(new Date(closedAt).getTime() + PAY_WINDOW_MS).toISOString()
        : null
      const winnerName = row.winner_customer_id
        ? winners.get(row.winner_customer_id)?.name
        : undefined
      return {
        id: row.id,
        lot_number: numbers.get(row.id) as number,
        title: row.product?.title ?? null,
        seller: { name: row.auction?.seller?.name ?? "" },
        winner: winnerName ? { name: maskName(winnerName) as string } : null,
        winner_customer_id: row.winner_customer_id ?? null,
        final_price: row.final_price ?? null,
        closed_at: closedAt,
        pay_by: payBy,
        overdue: payBy !== null && new Date(payBy).getTime() < now,
        proof: toWonLotPaymentProof(row as unknown as Record<string, unknown>),
      }
    }),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
