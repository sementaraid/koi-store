import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createPiiRevealAuditStep } from "./steps/pii-reveal"

export type RevealFarmKtpWorkflowInput = {
  farm_id: string
  // From req.auth_context, never the body.
  actor_type: string
  actor_id: string
}

// Read only: the private provider key, after confirming the file still exists.
// 404 before the audit step when the farm has none or the provider lost it, so
// no audit row is written for a view that returns nothing.
const readFarmKtpKeyStep = createStep(
  "read-farm-ktp-key",
  async (input: { farm_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: ["id", "custom_fields.ktp_photo_key"],
      filters: { id: input.farm_id },
    })

    const key = (
      seller as
        | { custom_fields?: { ktp_photo_key?: string | null } | null }
        | undefined
    )?.custom_fields?.ktp_photo_key
    if (!key) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `KTP photo for farm ${input.farm_id} not found`
      )
    }

    // Confirm the provider still has it, so a missing file is a 404 with no
    // audit row rather than a logged view that sent nothing.
    try {
      await container.resolve(Modules.FILE).getAsBuffer(key)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `KTP photo for farm ${input.farm_id} not found`
      )
    }
    return new StepResponse(key)
  }
)

// US-092 T-092.5a (AC5, D-042): the KTP photo is NIK plus face, so viewing it
// is a full-PII reveal. The read and the audit row are one workflow; the route
// streams the bytes only after this returns, so no view goes unlogged.
export const revealFarmKtpWorkflow = createWorkflow(
  "reveal-farm-ktp",
  function (input: RevealFarmKtpWorkflowInput) {
    const key = readFarmKtpKeyStep({ farm_id: input.farm_id })

    createPiiRevealAuditStep({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      record_type: "seller",
      record_id: input.farm_id,
      field: "ktp_photo",
    })

    return new WorkflowResponse(key)
  }
)
