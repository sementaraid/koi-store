import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { createStep } from "@medusajs/framework/workflows-sdk"
import { isBanned, readActiveStrikeCounts } from "../../utils/strike"

type Query = Omit<RemoteQueryFunction, symbol>

export type AssertNotBannedStepInput = {
  // The account's customer id: req.auth_context.actor_id for a customer, the
  // member token's app_metadata.customer_id for a farmer (D-003).
  customer_id: string
  // D-055: the code the Koi app keys on.
  code: "banned_customer" | "banned_seller"
}

// US-059 AC2 (D-047, D-050, D-055): 2 active strikes (not removed, inside the
// 180-day window) refuse the action. Read-only, so no compensation. The ban is
// derived on every call, so a removal or an ageing strike lifts it with no
// separate action.
export const assertNotBannedStep = createStep(
  "assert-not-banned",
  async (input: AssertNotBannedStepInput, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const counts = await readActiveStrikeCounts(query, [input.customer_id])
    const active = counts.get(input.customer_id)?.active_count ?? 0

    if (isBanned(active)) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "Akun Anda diblokir karena memiliki 2 strike aktif.",
        input.code
      )
    }
  }
)
