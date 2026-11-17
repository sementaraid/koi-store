import { MedusaError } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  uploadFilesStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createTopupRequestStep } from "./steps/create-topup-request"

export type CreateTopupRequestWorkflowInput = {
  customer_id: string
  amount: number
  screenshot: {
    filename: string
    mimeType: string
    // base64, as the File Module providers expect.
    content: string
  }
}

// US-011 AC2: upload the transfer screenshot, then record a pending request.
// If the insert fails, uploadFilesStep's compensation deletes the file.
export const createTopupRequestWorkflow = createWorkflow(
  "create-topup-request",
  function (input: CreateTopupRequestWorkflowInput) {
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "wallet.id"],
      filters: { id: input.customer_id },
    })

    // Checked before the upload so a refused request writes no file.
    const walletId = transform({ customers }, ({ customers }) => {
      const id: string | undefined = customers[0]?.wallet?.id
      if (!id) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Lengkapi profil Anda sebelum mengajukan top-up."
        )
      }
      return id
    })

    // Takes walletId so the check above resolves (and throws) before upload.
    // Private: a transfer screenshot is personal financial data. Only the
    // admin screenshot route streams it.
    const files = uploadFilesStep(
      transform({ input, walletId }, ({ input }) => ({
        files: [{ ...input.screenshot, access: "private" as const }],
      }))
    )

    const request = createTopupRequestStep(
      transform({ input, walletId, files }, ({ input, walletId, files }) => ({
        wallet_id: walletId,
        amount: input.amount,
        // FileDTO.id is the provider key (e.g. "private-…-bukti-transfer.png").
        screenshot_file_key: files[0].id,
      }))
    )

    return new WorkflowResponse(request)
  }
)
