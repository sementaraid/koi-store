import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { uploadFilesStep } from "@medusajs/medusa/core-flows"

export type UploadFarmFileWorkflowInput = {
  filename: string
  mimeType: string
  // base64, as the File Module providers expect.
  content: string
  access: "public" | "private"
}

// T-020.5: one file, one upload. uploadFilesStep compensates by deleting the
// file if a later step fails, so the route never leaves an orphan.
export const uploadFarmFileWorkflow = createWorkflow(
  "upload-farm-file",
  function (input: UploadFarmFileWorkflowInput) {
    const files = uploadFilesStep({
      files: [
        {
          filename: input.filename,
          mimeType: input.mimeType,
          content: input.content,
          access: input.access,
        },
      ],
    })

    return new WorkflowResponse(files)
  }
)
