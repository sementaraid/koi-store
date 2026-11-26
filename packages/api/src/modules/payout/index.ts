import { Module } from "@medusajs/framework/utils"
import PayoutModuleService from "./service"

// `farmer_payout`, not `payout`: Mercur registers its own `payout` service
// (Stripe Connect) and link definitions that expect a `payout_id` on it, so
// taking that id makes the link loader fail at boot.
export const PAYOUT_MODULE = "farmer_payout"

export default Module(PAYOUT_MODULE, {
  service: PayoutModuleService,
})
