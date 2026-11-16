import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createPiiRevealAuditStep } from "./steps/pii-reveal"
import {
  assertSellerNotTerminatedStep,
  readWinnerAddressStep,
  type WinnerAddress,
} from "./steps/sold-lot"

export type RevealWinnerAddressWorkflowInput = {
  // From req.seller_context, never the body.
  seller_id: string
  lot_id: string
  // From req.auth_context, never the body.
  actor_type: string
  actor_id: string
}

export type RevealWinnerAddressResult = {
  field: "shipping_address"
  value: WinnerAddress
}

// US-051 T-051.5 (AC4, AC5, D-056): the only way to the winner's full default
// shipping address. Read and audit row are one workflow; the value returns
// only after the row is written, so no reveal goes unlogged. A missing default
// address throws in the read step, before the audit, so no row is written.
export const revealWinnerAddressWorkflow = createWorkflow(
  "reveal-winner-address",
  function (input: RevealWinnerAddressWorkflowInput) {
    assertSellerNotTerminatedStep({ seller_id: input.seller_id })

    const value = readWinnerAddressStep({
      seller_id: input.seller_id,
      lot_id: input.lot_id,
    })

    createPiiRevealAuditStep({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      record_type: "lot",
      record_id: input.lot_id,
      field: "shipping_address",
    })

    return new WorkflowResponse(
      transform({ value }, ({ value }) => ({
        field: "shipping_address" as const,
        value,
      }))
    )
  }
)
