import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ADMIN_ACCOUNT_FIELDS,
  toAdminAccounts,
  type AdminAccount,
  type AdminAccountRow,
} from "../route"

export type AdminAccountDetailResponse = { account: AdminAccount }

// US-070 T-070.1a: one user's row, the same shape as the list. Read only; the
// wallet ledger and strikes are the existing routes' jobs.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminAccountDetailResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "customer",
    fields: ADMIN_ACCOUNT_FIELDS,
    filters: { id: req.params.id },
  })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Akun tidak ditemukan.")
  }

  const [account] = await toAdminAccounts(req.scope, [row as AdminAccountRow])
  res.json({ account })
}
