import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { LotPayout } from "./models/lot-payout"

export type LotPayoutDTO = InferEntityType<typeof LotPayout>

// Thin CRUD only (best-practices/modules). The lot and seller are soft
// references; all reads go through `query.graph`.
class PayoutModuleService extends MedusaService({
  LotPayout,
}) {}

export default PayoutModuleService
