import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
} from "@medusajs/medusa/core-flows"
import { ensureSettingsStep } from "./steps/ensure-settings"
import { SettingsPatch, updateSettingsStep } from "./steps/update-settings"

export type UpdatePlatformSettingsWorkflowInput = {
  update: SettingsPatch
}

// One fixed lock key: the settings table is a singleton, so concurrent first
// writes must serialise (a second row would make an admin's save invisible).
const SETTINGS_LOCK_KEY = "platform-settings"

export const updatePlatformSettingsWorkflow = createWorkflow(
  "update-platform-settings",
  function (input: UpdatePlatformSettingsWorkflowInput) {
    acquireLockStep({ key: SETTINGS_LOCK_KEY, timeout: 10, ttl: 30 })

    const settings = ensureSettingsStep()

    // Step output properties may only be read inside transform, never in the
    // composition body.
    const updateInput = transform(
      { settings, update: input.update },
      ({ settings, update }) => ({ settings_id: settings.id, update })
    )

    const updated = updateSettingsStep(updateInput)

    releaseLockStep({ key: SETTINGS_LOCK_KEY })

    return new WorkflowResponse(updated)
  }
)
