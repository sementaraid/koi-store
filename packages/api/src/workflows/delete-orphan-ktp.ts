import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  deleteOrphanKtpFilesStep,
  listOrphanKtpFilesStep,
  ORPHAN_KTP_BATCH_SIZE,
  orphanKtpRetentionMs,
} from "./steps/orphan-ktp"

export type DeleteOrphanKtpResult = {
  deleted: number
}

// US-093 (AC1–AC3): delete at most one batch of private KTP files that no
// seller references and that are older than the retention window. Read step
// then delete step; nothing is marked, so a second run over the same set
// simply finds nothing (idempotent). Public farm photos and the sellers' KTP
// keys are never listed (steps/orphan-ktp.ts).
export const deleteOrphanKtpWorkflow = createWorkflow(
  "delete-orphan-ktp",
  function () {
    const keys = listOrphanKtpFilesStep({
      retention_ms: orphanKtpRetentionMs(),
      batch_size: ORPHAN_KTP_BATCH_SIZE,
    })
    const deleted = deleteOrphanKtpFilesStep(keys)

    return new WorkflowResponse(
      transform({ deleted }, ({ deleted }) => ({
        deleted: deleted.length,
      })) satisfies DeleteOrphanKtpResult
    )
  }
)
