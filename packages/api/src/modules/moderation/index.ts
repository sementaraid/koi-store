import { Module } from "@medusajs/framework/utils"
import ModerationModuleService from "./service"

export const MODERATION_MODULE = "moderation"

export default Module(MODERATION_MODULE, {
  service: ModerationModuleService,
})
