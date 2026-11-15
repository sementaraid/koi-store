import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PLATFORM_SETTING_DEFAULTS } from "../../../modules/platform-settings/defaults"
import { updatePlatformSettingsWorkflow } from "../../../workflows/update-platform-settings"
import type { AdminUpdateSettingsType } from "./validators"

export type AdminSettings = {
  extend_window_minutes: number
  max_lots_per_auction: number
  auction_min_days: number
  auction_max_days: number
  claim_window_hours: number
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
}

export type AdminSettingsResponse = { settings: AdminSettings }

const toSettings = (row: Partial<AdminSettings> | null): AdminSettings => ({
  extend_window_minutes:
    row?.extend_window_minutes ?? PLATFORM_SETTING_DEFAULTS.extend_window_minutes,
  max_lots_per_auction:
    row?.max_lots_per_auction ?? PLATFORM_SETTING_DEFAULTS.max_lots_per_auction,
  auction_min_days:
    row?.auction_min_days ?? PLATFORM_SETTING_DEFAULTS.auction_min_days,
  auction_max_days:
    row?.auction_max_days ?? PLATFORM_SETTING_DEFAULTS.auction_max_days,
  claim_window_hours:
    row?.claim_window_hours ?? PLATFORM_SETTING_DEFAULTS.claim_window_hours,
  bank_name: row?.bank_name ?? PLATFORM_SETTING_DEFAULTS.bank_name,
  bank_account_number:
    row?.bank_account_number ?? PLATFORM_SETTING_DEFAULTS.bank_account_number,
  bank_account_holder:
    row?.bank_account_holder ?? PLATFORM_SETTING_DEFAULTS.bank_account_holder,
})

// Read-only: returns defaults when no row exists yet (US-015 AC1).
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminSettingsResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "platform_setting",
    fields: Object.keys(PLATFORM_SETTING_DEFAULTS),
    pagination: { take: 1 },
  })

  res.json({ settings: toSettings(row ?? null) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSettingsType>,
  res: MedusaResponse<AdminSettingsResponse>
) => {
  const { result } = await updatePlatformSettingsWorkflow(req.scope).run({
    input: { update: req.validatedBody },
  })

  res.json({ settings: toSettings(result) })
}
