import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"
import { SellerStatus } from "@mercurjs/types"

export type ValidateSellerOpenStepInput = {
  // From the route's `req.seller_context.seller_id` (x-seller-id, membership
  // already checked by Mercur's ensureSellerMiddleware). Never from the body.
  seller_id: string
}

// US-021 AC4 (T-021.5): farmer actions need an approved farm. Mercur's
// /vendor/* checks membership, not status, so every custom /vendor/* mutation
// workflow runs this step first (US-030 create auction, US-031 submit, ...).
// Pending, rejected (suspended) and terminated farms are refused with 403.
// Read-only, so no compensation.
export const validateSellerOpenStep = createStep(
  "validate-seller-open",
  async (input: ValidateSellerOpenStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: ["id", "status"],
      filters: { id: input.seller_id },
    })

    if (seller?.status !== SellerStatus.OPEN) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Your farm is not approved, so farmer actions are closed."
      )
    }
  }
)
