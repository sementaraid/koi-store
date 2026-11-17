import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { Claim } from "./models/claim"

export type ClaimDTO = InferEntityType<typeof Claim>

// Thin CRUD only (best-practices/modules). T-054.1a uses the generated
// createClaims / listClaims / retrieveClaim / listAndCountClaims.
class ModerationModuleService extends MedusaService({ Claim }) {}

export default ModerationModuleService
