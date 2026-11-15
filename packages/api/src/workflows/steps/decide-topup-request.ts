import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { WALLET_MODULE } from "../../modules/wallet"
import type WalletModuleService from "../../modules/wallet/service"

export type DecideTopupRequestStepInput = {
  id: string
  status: "approved" | "rejected"
  reviewed_by: string
  reason: string | null
}

// One mutation: the decision. The request row is not the ledger, so updating it
// is allowed; compensation restores exactly the fields this step changed, so a
// later failure leaves the request pending again.
// decided_at is set here (not in the composition body) so the server's clock
// decides when the decision happened.
// Only a pending request can be decided (AC3). Under the workflow's per-request
// lock this read-then-write is safe: a concurrent approval waits for the lock,
// then sees the first decision here and is refused with 409.
export const decideTopupRequestStep = createStep(
  "decide-topup-request",
  async (input: DecideTopupRequestStepInput, { container }) => {
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const previous = await service.retrieveTopupRequest(input.id)
    if (previous.status !== "pending") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        `Top-up request ${input.id} was already decided (${previous.status})`
      )
    }
    const [updated] = await service.updateTopupRequests([
      { ...input, decided_at: new Date() },
    ])
    return new StepResponse(updated, {
      id: input.id,
      previous: {
        status: previous.status,
        reviewed_by: previous.reviewed_by,
        reason: previous.reason,
        decided_at: previous.decided_at,
      },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: {
            status: "pending" | "approved" | "rejected"
            reviewed_by: string | null
            reason: string | null
            decided_at: Date | null
          }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    await service.updateTopupRequests([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)

export type CreateManualTopupStepInput = {
  wallet_id: string
  amount: number
  reference: string
  created_by: string
}

// One mutation: append the credit. Deliberately the workflow's LAST step and
// given no compensation: wallet transactions are append-only (plan.md "Rules"),
// and with nothing after it no later failure can require it undone. The
// request update that precedes it does compensate.
export const createManualTopupStep = createStep(
  "create-manual-topup",
  async (input: CreateManualTopupStepInput, { container }) => {
    const service = container.resolve<WalletModuleService>(WALLET_MODULE)
    const [transaction] = await service.createWalletTransactions([
      {
        wallet_id: input.wallet_id,
        type: "manual_topup",
        amount: input.amount,
        reference: input.reference,
        created_by: input.created_by,
      },
    ])
    return new StepResponse(transaction)
  }
)
