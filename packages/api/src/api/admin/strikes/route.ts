import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { giveStrikeWorkflow } from "../../../workflows/give-strike"
import { readActiveStrikeCounts } from "../../../utils/strike"
import {
  STRIKE_FIELDS,
  toAdminStrikeRow,
  type AdminStrikeResult,
  type StrikeRecord,
} from "./rows"
import type { AdminGiveStrikeType, AdminGetStrikesParamsType } from "./validators"

// US-059 T-059.1a (AC1, AC2, AC4, D-002, D-041, D-055, D-058): the admin gives
// one strike with a written reason. Medusa's /admin auth refuses any non-admin
// actor before this runs. The subject is resolved server-side (customer, the
// farm's member account, or the lot's winner); the ban is derived from the
// active count. No money moves and no ledger row is written.
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminGiveStrikeType>,
  res: MedusaResponse<AdminStrikeResult>
) => {
  const { result } = await giveStrikeWorkflow(req.scope).run({
    input: {
      customer_id: req.validatedBody.customer_id,
      seller_id: req.validatedBody.seller_id,
      lot_id: req.validatedBody.lot_id,
      reason_type: req.validatedBody.reason_type,
      reason: req.validatedBody.reason,
      admin_id: req.auth_context.actor_id,
    },
  })

  // Re-read through query.graph so the response uses the stored values and the
  // same serializer as GET, not the step's Date objects.
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [strike],
  } = await query.graph({
    entity: "strike",
    fields: STRIKE_FIELDS,
    filters: { id: result.strike.id },
  })

  res.status(201).json({
    strike: toAdminStrikeRow(strike as StrikeRecord),
    ban: result.ban,
  })
}

export type AdminStrikesResponse = {
  strikes: ReturnType<typeof toAdminStrikeRow>[]
  active_count: number
  banned: boolean
  count: number
  limit: number
  offset: number
}

// US-059 T-059.1a (AC2, AC3): one customer's strike history. Every row is
// `customer_id`, `seller_id`, `lot_id`, `reason_type`, `reason`, `created_at`,
// `removed_*` — never a phone, NIK or bank field.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetStrikesParamsType>,
  res: MedusaResponse<AdminStrikesResponse>
) => {
  const { customer_id, limit, offset } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "strike",
    fields: STRIKE_FIELDS,
    filters: { customer_id },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  // The ban is computed over the whole history, not the page.
  const counts = await readActiveStrikeCounts(query, [customer_id])
  const ban = counts.get(customer_id) ?? { active_count: 0, banned: false }

  res.json({
    strikes: (data as StrikeRecord[]).map(toAdminStrikeRow),
    active_count: ban.active_count,
    banned: ban.banned,
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
