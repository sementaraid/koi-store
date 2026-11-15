import { Module } from "@medusajs/framework/utils"
import PlatformSettingsModuleService from "./service"

export const PLATFORM_SETTINGS_MODULE = "platform_settings"

export default Module(PLATFORM_SETTINGS_MODULE, {
  service: PlatformSettingsModuleService,
})
