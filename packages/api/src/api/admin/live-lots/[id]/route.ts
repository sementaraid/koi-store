import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { winnersById } from "../../../vendor/claims/route"

// US-072 T-072.1b (D-002, D-042, D-052). One lot's bid list for the admin's
// monitoring panel, removed rows included and marked. Full name plus opaque
// customer id (as US-070/US-071); phone, email, NIK, bank and address are never
// selected.

export type AdminLiveLotBid = {
  id: string
  amount: number
  created_at: string
  source: string
  removed_at: string | null
  removed_reason: string | null
  removed_by: string | null
  removed_by_name: string | null
  bidder: { customer_id: string; name: string }
}

export type AdminLiveLot = {
  id: string
  auction_id: string
  status: string
  ob: number
  kb: number
  current_price: number
  end_time: string
  cancel_reason: string | null
}

export type AdminLiveLotResponse = {
  lot: AdminLiveLot
  bids: AdminLiveLotBid[]
}

type LotRow = {
  id: string
  auction_id: string
  status: string
  ob: number
  kb: number
  current_price: number
  end_time: Date | string
  cancel_reason: string | null
  bids?: {
    id: string
    amount: number
    created_at: Date | string
    source: string
    removed_at: Date | string | null
    removed_reason: string | null
    removed_by: string | null
    customer_id: string
  }[]
}

// Medusa's /admin auth rejects any non-admin actor before this runs (D-002).
// 404 for an unknown lot only: the panel also opens a lot that has since closed
// (T-072.2b shows no remove button there), so the admin can still read the audit.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminLiveLotResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [row],
  } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "auction_id",
      "status",
      "ob",
      "kb",
      "current_price",
      "end_time",
      "cancel_reason",
      "bids.id",
      "bids.amount",
      "bids.created_at",
      "bids.source",
      "bids.removed_at",
      "bids.removed_reason",
      "bids.removed_by",
      "bids.customer_id",
    ],
    filters: { id: req.params.id },
  })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
  }
  const lot = row as LotRow

  const bids = [...(lot.bids ?? [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
      b.id.localeCompare(a.id)
  )
  // One batched name read for the lot's bidders, no per-row query.
  const names = await winnersById(req.scope, [
    ...new Set(bids.map((bid) => bid.customer_id)),
  ])
  // Same rule for the admins who removed bids. A deleted user keeps the id and
  // gets no name.
  const removerIds = [...new Set(bids.map((bid) => bid.removed_by).filter(Boolean))] as string[]
  const removerNames = new Map<string, string>()
  if (removerIds.length) {
    const { data: users } = await query.graph({
      entity: "user",
      fields: ["id", "first_name", "last_name"],
      filters: { id: removerIds },
    })
    for (const user of users as {
      id: string
      first_name?: string | null
      last_name?: string | null
    }[]) {
      removerNames.set(
        user.id,
        [user.first_name, user.last_name].filter(Boolean).join(" ")
      )
    }
  }

  res.json({
    lot: {
      id: lot.id,
      auction_id: lot.auction_id,
      status: lot.status,
      ob: Number(lot.ob),
      kb: Number(lot.kb),
      current_price: Number(lot.current_price),
      end_time: new Date(lot.end_time).toISOString(),
      cancel_reason: lot.cancel_reason,
    },
    bids: bids.map((bid) => ({
      id: bid.id,
      amount: Number(bid.amount),
      created_at: new Date(bid.created_at).toISOString(),
      source: bid.source,
      removed_at: bid.removed_at ? new Date(bid.removed_at).toISOString() : null,
      removed_reason: bid.removed_reason,
      removed_by: bid.removed_by,
      removed_by_name: bid.removed_by
        ? removerNames.get(bid.removed_by) || null
        : null,
      bidder: {
        customer_id: bid.customer_id,
        name: names.get(bid.customer_id)?.name ?? "",
      },
    })),
  })
}
