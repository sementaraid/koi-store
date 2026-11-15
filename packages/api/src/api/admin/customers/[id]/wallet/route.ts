import { MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getCustomerWallet,
  type StoreWalletResponse,
} from "../../../../store/wallet/route"
import type { AdminGetCustomerWalletParamsType } from "./validators"

export type AdminCustomerWalletResponse = StoreWalletResponse

// US-013: the correction screen's view of one customer's balance and history,
// newest first. Read-only; a customer without a wallet gets the empty response.
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetCustomerWalletParamsType>,
  res: MedusaResponse<AdminCustomerWalletResponse>
) => {
  const wallet = await getCustomerWallet(
    req.scope,
    req.params.id,
    req.validatedQuery.limit ?? 20,
    req.validatedQuery.offset ?? 0
  )
  if (!wallet) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Customer with id: ${req.params.id} was not found`
    )
  }
  res.json(wallet)
}
