import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { PlatformSettingDTO } from "../../modules/platform-settings/service"
import { PLATFORM_SETTINGS_MODULE } from "../../modules/platform-settings"
import type PlatformSettingsModuleService from "../../modules/platform-settings/service"

export type SettingsPatch = Partial<
  Omit<
    PlatformSettingDTO,
    "id" | "created_at" | "updated_at" | "deleted_at"
  >
>

export type UpdateSettingsStepInput = {
  settings_id: string
  update: SettingsPatch
}

// Single mutation: write the patch. Cross-field validity is checked against the
// merged row first (a patch may only set one of the two auction bounds).
// Compensation restores exactly the fields this step changed.
export const updateSettingsStep = createStep(
  "update-settings",
  async (input: UpdateSettingsStepInput, { container }) => {
    const service = container.resolve<PlatformSettingsModuleService>(
      PLATFORM_SETTINGS_MODULE
    )

    const id = input.settings_id
    const previous = await service.retrievePlatformSetting(id)
    const merged = { ...previous, ...input.update }

    if (merged.auction_min_days > merged.auction_max_days) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "auction_min_days must not be greater than auction_max_days"
      )
    }

    const [updated] = await service.updatePlatformSettings([
      { id, ...input.update },
    ])

    const restore = Object.fromEntries(
      Object.keys(input.update).map((key) => [
        key,
        previous[key as keyof PlatformSettingDTO],
      ])
    ) as SettingsPatch

    return new StepResponse(updated, { id, previous: restore })
  },
  async (
    compensation: { id: string; previous: SettingsPatch } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<PlatformSettingsModuleService>(
      PLATFORM_SETTINGS_MODULE
    )
    await service.updatePlatformSettings([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)
