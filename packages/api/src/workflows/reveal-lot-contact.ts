import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { SOLD_LOT_STATUSES } from "../api/vendor/sold-lots/validators"
import { decryptPii } from "../utils/pii-crypto"
import { createPiiRevealAuditStep } from "./steps/pii-reveal"

export type WonLotBank = {
  bank_name: string | null
  holder_name: string
  account_number: string
}

export type ReadWonLotBankStepInput = {
  // From req.auth_context.actor_id, never the body.
  customer_id: string
  lot_id: string
}

// US-051 T-051.3a (AC3, D-044, D-052, D-057, D-059): the farmer's full payout
// account for the winner's own sold lot. Another customer's lot, a non-sold lot
// and a missing lot are 404 with no existence leak; a farm without
// payment_details is 404 too, so no audit row is written for nothing. `phone`
// is never selected (D-052). Read at reveal time; the masked list row stays
// masked (T-051.1a).
export const readWonLotBankStep = createStep(
  "read-won-lot-bank",
  async (input: ReadWonLotBankStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "winner_customer_id", "auction.seller_id"],
      filters: { id: input.lot_id },
    })
    const sold: readonly string[] = SOLD_LOT_STATUSES
    if (
      !lot ||
      lot.winner_customer_id !== input.customer_id ||
      !sold.includes(lot.status as string)
    ) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }

    const sellerId = (lot.auction as { seller_id?: string } | null)?.seller_id
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: [
        "id",
        "payment_details.bank_name",
        "payment_details.holder_name",
        "payment_details.account_number",
      ],
      filters: { id: sellerId as string },
    })
    const details = seller?.payment_details as
      | {
          bank_name?: string | null
          holder_name?: string | null
          account_number?: string | null
        }
      | null
      | undefined
    if (!details?.account_number || !details?.holder_name) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Rekening bank peternak belum diisi."
      )
    }

    return new StepResponse<WonLotBank>({
      bank_name: details.bank_name ?? null,
      // D-043: the columns are ciphertext; the reveal returns plaintext.
      holder_name: decryptPii(details.holder_name) as string,
      account_number: decryptPii(details.account_number) as string,
    })
  }
)

export type RevealFarmBankAccountWorkflowInput = ReadWonLotBankStepInput & {
  // From req.auth_context, never the body.
  actor_type: string
  actor_id: string
}

export type RevealFarmBankAccountResult = {
  field: "bank_account"
  value: WonLotBank
}

// US-051 T-051.3a (AC4, D-042, D-057): the only way to the farmer's full bank
// account. Read and audit row are one workflow; the value returns only after
// the row is written, so no reveal goes unlogged. A refused read throws before
// the audit, so no row is written.
export const revealFarmBankAccountWorkflow = createWorkflow(
  "reveal-farm-bank-account",
  function (input: RevealFarmBankAccountWorkflowInput) {
    const value = readWonLotBankStep({
      customer_id: input.customer_id,
      lot_id: input.lot_id,
    })

    createPiiRevealAuditStep({
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      record_type: "lot",
      record_id: input.lot_id,
      field: "bank_account",
    })

    return new WorkflowResponse(
      transform({ value }, ({ value }) => ({
        field: "bank_account" as const,
        value,
      }))
    )
  }
)
