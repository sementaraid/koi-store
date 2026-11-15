import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PLATFORM_SETTING_DEFAULTS } from "../../../modules/platform-settings/defaults"

export type StorePlatformBankAccountResponse = {
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
}

// US-011 AC3 / D-009: where customers transfer to. Selects only the bank
// fields, so no other setting can leak through this route.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StorePlatformBankAccountResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "platform_setting",
    fields: ["bank_name", "bank_account_number", "bank_account_holder"],
    pagination: { take: 1 },
  })

  res.json({
    bank_name: row?.bank_name ?? PLATFORM_SETTING_DEFAULTS.bank_name,
    bank_account_number:
      row?.bank_account_number ?? PLATFORM_SETTING_DEFAULTS.bank_account_number,
    bank_account_holder:
      row?.bank_account_holder ?? PLATFORM_SETTING_DEFAULTS.bank_account_holder,
  })
}
