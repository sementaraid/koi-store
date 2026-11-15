import { model } from "@medusajs/framework/utils"
import { PLATFORM_SETTING_DEFAULTS } from "../defaults"

// D-010: platform settings live in the database, one row.
export const PlatformSetting = model.define("platform_setting", {
  id: model.id({ prefix: "pset" }).primaryKey(),
  // Always true; the unique index on it (src/migration-scripts) is what makes
  // the table a singleton at the database level.
  singleton: model.boolean().default(true),
  extend_window_minutes: model
    .number()
    .default(PLATFORM_SETTING_DEFAULTS.extend_window_minutes),
  max_lots_per_auction: model
    .number()
    .default(PLATFORM_SETTING_DEFAULTS.max_lots_per_auction),
  auction_min_days: model
    .number()
    .default(PLATFORM_SETTING_DEFAULTS.auction_min_days),
  auction_max_days: model
    .number()
    .default(PLATFORM_SETTING_DEFAULTS.auction_max_days),
  claim_window_hours: model
    .number()
    .default(PLATFORM_SETTING_DEFAULTS.claim_window_hours),
  bank_name: model.text().default(PLATFORM_SETTING_DEFAULTS.bank_name),
  bank_account_number: model
    .text()
    .default(PLATFORM_SETTING_DEFAULTS.bank_account_number),
  bank_account_holder: model
    .text()
    .default(PLATFORM_SETTING_DEFAULTS.bank_account_holder),
})
