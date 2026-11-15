import { Module } from "@medusajs/framework/utils"
import PiiAuditModuleService from "./service"

export const PII_AUDIT_MODULE = "pii_audit"

export default Module(PII_AUDIT_MODULE, {
  service: PiiAuditModuleService,
})
