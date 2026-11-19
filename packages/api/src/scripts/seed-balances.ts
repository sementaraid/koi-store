import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

import { WALLET_MODULE } from "../modules/wallet"
import type WalletModuleService from "../modules/wallet/service"
import { createCustomerWalletWorkflow } from "../workflows/create-customer-wallet"

/*
 * Dev top-up: gives every customer a wallet with Rp50.000.000 so the join,
 * bid and checkout flows can be exercised without the admin top-up approval.
 *
 * A wallet is created only by `createCustomerWalletWorkflow`, which requires a
 * complete profile (first name, last name, phone). The seeded customers have
 * no phone, so this fills one first — without it no wallet is created and the
 * balance silently stays Rp0.
 *
 * The credit is an appended `adjustment`, never an update: the ledger is
 * append-only (CLAUDE.md invariant). Idempotent per customer, keyed on the
 * adjustment's reference.
 */

const TOP_UP = 50_000_000
const REASON = "Seed · saldo uji coba"
const DEFAULT_PHONE = "081200000000"

type Row = {
  id: string
  email: string
  phone?: string | null
}

export default async function seedBalances({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const customerService = container.resolve(Modules.CUSTOMER)
  const walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "phone"],
  })

  for (const customer of customers as Row[]) {
    if (!customer.phone?.trim()) {
      await customerService.updateCustomers(customer.id, {
        phone: DEFAULT_PHONE,
      })
    }

    // Idempotent: creates the wallet only when the customer has none.
    await createCustomerWalletWorkflow(container).run({
      input: { customer_id: customer.id },
    })

    const {
      data: [row],
    } = await query.graph({
      entity: "customer",
      fields: ["wallet.id"],
      filters: { id: customer.id },
    })
    const walletId = (row as { wallet?: { id?: string } } | undefined)?.wallet?.id
    if (!walletId) {
      logger.warn(`${customer.email}: no wallet, skipped.`)
      continue
    }

    const { data: existing } = await query.graph({
      entity: "wallet_transaction",
      fields: ["id"],
      filters: { wallet_id: walletId, reference: REASON },
    })
    if (existing[0]) {
      logger.info(`${customer.email}: already topped up, skipped.`)
      continue
    }

    await walletService.createWalletTransactions([
      {
        wallet_id: walletId,
        type: "adjustment",
        amount: TOP_UP,
        reference: REASON,
        created_by: null,
      },
    ])
    logger.info(`${customer.email}: +Rp${TOP_UP.toLocaleString("id-ID")}`)
  }

  logger.info("Finished topping up customer wallets.")
}
