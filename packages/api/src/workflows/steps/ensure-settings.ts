import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PLATFORM_SETTINGS_MODULE } from "../../modules/platform-settings"
import type PlatformSettingsModuleService from "../../modules/platform-settings/service"
import type { PlatformSettingDTO } from "../../modules/platform-settings/service"

// Single mutation: create the settings row only if the table is empty. The
// compensation payload is the created id, or null when the row already existed.
export const ensureSettingsStep = createStep<
  void,
  PlatformSettingDTO,
  string | null
>(
  "ensure-settings",
  async (_: void, { container }) => {
    const service = container.resolve<PlatformSettingsModuleService>(
      PLATFORM_SETTINGS_MODULE
    )
    const [existing] = await service.listPlatformSettings({}, { take: 1 })
    if (existing) {
      return new StepResponse<PlatformSettingDTO, string | null>(existing, null)
    }
    const [created] = await service.createPlatformSettings([{}])
    return new StepResponse<PlatformSettingDTO, string | null>(
      created,
      created.id
    )
  },
  // CompensateFn passes `T | undefined` (step never ran → undefined).
  async (createdId: string | null | undefined, { container }) => {
    if (!createdId) {
      return
    }
    const service = container.resolve<PlatformSettingsModuleService>(
      PLATFORM_SETTINGS_MODULE
    )
    await service.deletePlatformSettings([createdId])
  }
)
