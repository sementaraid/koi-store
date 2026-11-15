import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { FeeCategory } from "./models/fee-category"
import { PlatformSetting } from "./models/platform-setting"

export type PlatformSettingDTO = InferEntityType<typeof PlatformSetting>
export type FeeCategoryDTO = InferEntityType<typeof FeeCategory>

// Thin CRUD only (best-practices/modules). The settings table holds at most one
// row; callers read it with listPlatformSettings({}, { take: 1 }). The fee table
// (US-014) is platform pricing, so it lives in the same module.
class PlatformSettingsModuleService extends MedusaService({
  PlatformSetting,
  FeeCategory,
}) {}

export default PlatformSettingsModuleService
