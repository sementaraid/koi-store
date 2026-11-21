import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createPiiRevealAuditStep, readCustomerPhoneStep } from "./steps/pii-reveal"

export type RevealCustomerPiiWorkflowInput = {
  customer_id: string
  // From req.auth_context, never the body.
  actor_type: string
  actor_id: string
}

// US-070 T-070.1b (D-042): the only way to a customer's full phone. The read
// and the audit row are one workflow; the value is returned only after the row
// is written, so no reveal goes unlogged.
export const revealCustomerPiiWorkflow = createWorkflow(
  "reveal-customer-pii",
  function (input: RevealCustomerPiiWorkflowInput) {
    const value = readCustomerPhoneStep({ customer_id: input.customer_id })

    createPiiRevealAuditStep({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      record_type: "customer",
      record_id: input.customer_id,
      field: "phone",
    })

    return new WorkflowResponse(
      transform({ value }, ({ value }) => ({ field: "phone" as const, value }))
    )
  }
)
