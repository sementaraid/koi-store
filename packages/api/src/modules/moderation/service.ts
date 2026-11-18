import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { Claim } from "./models/claim"
import { LotReport } from "./models/lot-report"

export type ClaimDTO = InferEntityType<typeof Claim>
export type LotReportDTO = InferEntityType<typeof LotReport>

// Thin CRUD only (best-practices/modules). T-054.1a uses the generated
// createClaims / listClaims / retrieveClaim / listAndCountClaims; T-058.1 the
// createLotReports / listLotReports pair.
class ModerationModuleService extends MedusaService({
  Claim,
  LotReport,
}) {}

export default ModerationModuleService
