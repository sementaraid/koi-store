import { Modules } from "@medusajs/framework/utils"
import type { LinkDefinition } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  createRemoteLinkStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { WALLET_MODULE } from "../modules/wallet"
import { createWalletStep } from "./steps/create-wallet"

type CustomerProfile = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

// Owner decision (T-010.5): a wallet exists once the registration profile is
// complete: first name, last name and phone all non-empty after trim, matching
// storefront-koi registerSchema.
export const isProfileComplete = (c: CustomerProfile) =>
  [c.first_name, c.last_name, c.phone].every((v) => !!v?.trim())

export type CreateCustomerWalletWorkflowInput = { customer_id: string }

// Idempotent: the state is re-read under a per-customer lock, so duplicate or
// concurrent events create at most one wallet. The unique index on the link
// table (src/migration-scripts) is the database backstop.
export const createCustomerWalletWorkflow = createWorkflow(
  "create-customer-wallet",
  function (input: CreateCustomerWalletWorkflowInput) {
    const lockKey = transform(input, ({ customer_id }) => `wallet:${customer_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "first_name", "last_name", "phone", "wallet.id"],
      filters: { id: input.customer_id },
    })

    const shouldCreate = transform({ customers }, ({ customers }) => {
      const customer = customers[0]
      return !!customer && !customer.wallet?.id && isProfileComplete(customer)
    })

    const wallet = when("create-wallet-if-missing", { shouldCreate }, ({ shouldCreate }) => shouldCreate).then(() => {
      const created = createWalletStep()
      const links = transform(
        { created, input },
        ({ created, input }): LinkDefinition[] => [
          {
            [Modules.CUSTOMER]: { customer_id: input.customer_id },
            [WALLET_MODULE]: { wallet_id: created.id },
          },
        ]
      )
      createRemoteLinkStep(links)
      return created
    })

    releaseLockStep({ key: lockKey })

    // undefined when nothing was created (incomplete profile or wallet exists).
    const result = transform({ wallet }, ({ wallet }) => wallet ?? null)

    return new WorkflowResponse(result)
  }
)
