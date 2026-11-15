import CustomerModule from "@medusajs/medusa/customer"
import { defineLink } from "@medusajs/framework/utils"
import WalletModule from "../modules/wallet"

// One customer ↔ one wallet. Creating this link is the caller's job (wallet
// creation workflow, US-011+); no link exists until then, so GET /store/wallet
// returns an empty response instead of writing.
export default defineLink(
  CustomerModule.linkable.customer,
  WalletModule.linkable.wallet
)
