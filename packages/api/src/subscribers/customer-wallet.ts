import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createCustomerWalletWorkflow,
  isProfileComplete,
} from "../workflows/create-customer-wallet"

// Creates the customer's wallet once the profile is complete (T-010.5). The
// workflow re-checks under a lock, so a redelivered event is harmless.
export default async function customerWalletHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "last_name", "phone", "wallet.id"],
      filters: { id: event.data.id },
    })

    if (!customer || customer.wallet?.id || !isProfileComplete(customer)) {
      return
    }

    await createCustomerWalletWorkflow(container).run({
      input: { customer_id: customer.id },
    })
  } catch (e) {
    logger.error(`customer-wallet subscriber failed for ${event.data.id}: ${e}`)
  }
}

// Event names verified against Medusa's Customer Module events reference:
// customer.created (createCustomersWorkflow, createCustomerAccountWorkflow) and
// customer.updated (updateCustomersWorkflow).
export const config: SubscriberConfig = {
  event: ["customer.created", "customer.updated"],
}
