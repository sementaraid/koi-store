import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import {
  deleteClaimVideoFileStep,
  getDeletableClaimStep,
  markClaimVideoDeletedStep,
} from "./steps/claim"

export type DeleteClaimVideoWorkflowInput = { claim_id: string }

export type DeleteClaimVideoResult = {
  deleted: boolean
  skipped: boolean
  reason: string | null
}

// US-061 (AC1, D-018): delete a closed claim's private video 30 days after it
// closed and mark the row; the claim row stays. Same lock key as the claim
// decisions, so a decision and the cleanup can't interleave. The guard runs
// under the lock, so a re-run skips. No money (D-058).
export const deleteClaimVideoWorkflow = createWorkflow(
  "delete-claim-video",
  function (input: DeleteClaimVideoWorkflowInput) {
    const lockKey = transform(input, ({ claim_id }) => `claim:${claim_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const claim = getDeletableClaimStep({ claim_id: input.claim_id })

    const deleted = when({ claim }, ({ claim }) => !claim.skip).then(() => {
      deleteClaimVideoFileStep(
        transform({ claim }, ({ claim }) => ({
          file_key: claim.file_key as string,
        }))
      )
      return markClaimVideoDeletedStep({ claim_id: input.claim_id })
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(
      transform({ claim, deleted }, ({ claim, deleted }) => ({
        deleted: !claim.skip && !!deleted,
        skipped: claim.skip,
        reason: claim.skip ? (claim.reason ?? null) : null,
      })) satisfies DeleteClaimVideoResult
    )
  }
)
