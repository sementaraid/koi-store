import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { FarmPiiField } from "../api/admin/farms/validators"
import { createPiiRevealAuditStep, readFarmPiiStep } from "./steps/pii-reveal"

export type RevealFarmPiiWorkflowInput = {
  farm_id: string
  field: FarmPiiField
  // From req.auth_context, never the body.
  actor_type: string
  actor_id: string
}

// US-092 T-092.5 (D-042): the only way to a farm's full PII value. The read
// and the audit row are one workflow; the value is returned only after the
// row is written, so no reveal goes unlogged.
export const revealFarmPiiWorkflow = createWorkflow(
  "reveal-farm-pii",
  function (input: RevealFarmPiiWorkflowInput) {
    const value = readFarmPiiStep({ farm_id: input.farm_id, field: input.field })

    createPiiRevealAuditStep({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      record_type: "seller",
      record_id: input.farm_id,
      field: input.field,
    })

    return new WorkflowResponse(
      transform({ input, value }, ({ input, value }) => ({ field: input.field, value }))
    )
  }
)
