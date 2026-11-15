import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { StoreGetWalletParamsType } from "./validators"

export type StoreWalletTransaction = {
  id: string
  type: string
  amount: number
  reference: string | null
  created_at: string
}

export type StoreWalletResponse = {
  balance: number
  transactions: StoreWalletTransaction[]
  count: number
  limit: number
  offset: number
}

// Balance is always the sum of the ledger, never a stored number.
// ponytail: sums every row of one wallet in memory; move to SQL SUM if a
// single wallet ever holds tens of thousands of transactions.
export const walletBalance = async (scope: MedusaContainer, walletId: string) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: all } = await query.graph({
    entity: "wallet_transaction",
    fields: ["amount"],
    filters: { wallet_id: walletId },
  })
  return all.reduce((sum, t) => sum + Number(t.amount), 0)
}

// One customer's wallet page, newest first. Shared by GET /store/wallet and
// GET /admin/customers/:id/wallet (US-013). null = no such customer; a
// customer without a wallet gets the empty response (nothing is created).
export const getCustomerWallet = async (
  scope: MedusaContainer,
  customerId: string,
  limit: number,
  offset: number
): Promise<StoreWalletResponse | null> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "wallet.id"],
    filters: { id: customerId },
  })
  if (!customer) {
    return null
  }
  const walletId: string | undefined = customer.wallet?.id
  if (!walletId) {
    return { balance: 0, transactions: [], count: 0, limit, offset }
  }

  const { data: page, metadata } = await query.graph({
    entity: "wallet_transaction",
    fields: ["id", "type", "amount", "reference", "created_at"],
    filters: { wallet_id: walletId },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  return {
    balance: await walletBalance(scope, walletId),
    transactions: page.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      reference: t.reference ?? null,
      created_at: new Date(t.created_at).toISOString(),
    })),
    count: metadata?.count ?? 0,
    limit,
    offset,
  }
}

// Read-only by design: the wallet is created by the wallet workflow, never by
// this route. No wallet → empty response. Reads go through Query only
// (best-practices/module-links: "Cross-module reads go through query.graph").
export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetWalletParamsType>,
  res: MedusaResponse<StoreWalletResponse>
) => {
  const limit = req.validatedQuery.limit ?? 20
  const offset = req.validatedQuery.offset ?? 0

  res.json(
    (await getCustomerWallet(req.scope, req.auth_context.actor_id, limit, offset)) ?? {
      balance: 0,
      transactions: [],
      count: 0,
      limit,
      offset,
    }
  )
}
