import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { Claim } from "./models/claim"
import { FarmerRating } from "./models/farmer-rating"
import { LotReport } from "./models/lot-report"
import { Strike } from "./models/strike"

export type ClaimDTO = InferEntityType<typeof Claim>
export type FarmerRatingDTO = InferEntityType<typeof FarmerRating>
export type LotReportDTO = InferEntityType<typeof LotReport>
export type StrikeDTO = InferEntityType<typeof Strike>

// Thin CRUD only (best-practices/modules). T-054.1a uses the generated
// createClaims / listClaims / retrieveClaim / listAndCountClaims; T-058.1 the
// createLotReports / listLotReports pair; T-059.1a the create/update/listStrikes
// trio.
class ModerationModuleService extends MedusaService({
  Claim,
  FarmerRating,
  LotReport,
  Strike,
}) {}

export default ModerationModuleService
