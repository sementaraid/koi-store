import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { AdminGetTopupRequestsParamsType } from "./validators"

// US-012 T-012.1. Admin identity only (D-002, D-018): Medusa's /admin auth
// rejects a customer token before this handler runs.
// The customer is included because approving means matching the transfer
// against the bank statement, which needs a name and an email. Nothing more
// (no phone, no address) and never the screenshot (D-018).
export type AdminTopupRequestCustomer = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
}

export type AdminTopupRequest = {
  id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  reason: string | null
  reviewed_by: string | null
  // Omitted when the wallet has no linked customer yet.
  customer?: AdminTopupRequestCustomer
  created_at: string
  has_screenshot: boolean
}

export type AdminTopupRequestsResponse = {
  topup_requests: AdminTopupRequest[]
  count: number
  limit: number
  offset: number
}

export type AdminTopupRequestResponse = { request: AdminTopupRequest }

type Row = {
  id: string
  amount: unknown
  status: AdminTopupRequest["status"]
  reason?: string | null
  reviewed_by?: string | null
  screenshot_file_key?: string | null
  created_at: Date | string
  wallet?: {
    customer?: AdminTopupRequestCustomer | null
  } | null
}

export const toAdminTopupRequest = (r: Row): AdminTopupRequest => ({
  id: r.id,
  amount: Number(r.amount),
  status: r.status,
  reason: r.reason ?? null,
  reviewed_by: r.reviewed_by ?? null,
  // Omitted, not null, when there is no linked customer (admin-koi's type).
  ...(r.wallet?.customer
    ? {
        customer: {
          id: r.wallet.customer.id,
          email: r.wallet.customer.email ?? null,
          first_name: r.wallet.customer.first_name ?? null,
          last_name: r.wallet.customer.last_name ?? null,
        },
      }
    : {}),
  created_at: new Date(r.created_at).toISOString(),
  has_screenshot: !!r.screenshot_file_key,
})

// The field list every admin read uses, so one serializer serves both.
export const ADMIN_TOPUP_REQUEST_FIELDS = [
  "id",
  "amount",
  "status",
  "reason",
  "reviewed_by",
  "screenshot_file_key",
  "created_at",
  "wallet.customer.id",
  "wallet.customer.email",
  "wallet.customer.first_name",
  "wallet.customer.last_name",
]

// US-012: the admin queue. Newest first, optionally by status. Read-only.
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetTopupRequestsParamsType>,
  res: MedusaResponse<AdminTopupRequestsResponse>
) => {
  const { status, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "topup_request",
    fields: ADMIN_TOPUP_REQUEST_FIELDS,
    filters: status ? { status } : {},
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({
    topup_requests: data.map(toAdminTopupRequest),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
