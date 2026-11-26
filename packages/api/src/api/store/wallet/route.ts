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
  // Human-readable subject for the history's "Keterangan" column. `reference`
  // is already text for manual_topup (bank reference) and adjustment (reason);
  // for the auction-referencing types it is an internal auction id, so this is
  // the auction's first lot title instead. null when none can be resolved —
  // never an internal id.
  description: string | null
  created_at: string
}

// plan.md "Transaction types": these three store an auction OR lot id in
// `reference`. Before US-111 a join fee is charged once per auction (reference
// = auction id) and no lot is recorded, so the first lot (created_at, then id —
// the US-096 AC1 order) stands in for the auction name. From US-111 a join fee
// and a single-lot refund reference the lot directly (D-070, D-076). Both are
// resolved here; a lot id never collides with an auction id.
const AUCTION_REFERENCE_TYPES = new Set(["join_fee", "listing_fee", "refund"])

type AuctionRow = {
  id: string
  lots?: {
    id: string
    created_at: string | Date
    product?: { title?: string | null } | null
  }[]
}

type LotTitleRow = {
  id: string
  product?: { title?: string | null } | null
}

// One batched read per page, never per row.
const referenceDescriptions = async (
  scope: MedusaContainer,
  ids: string[]
): Promise<Map<string, string>> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: auctions } = await query.graph({
    entity: "auction",
    fields: ["id", "lots.id", "lots.created_at", "lots.product.title"],
    filters: { id: ids },
  })
  const { data: lots } = await query.graph({
    entity: "lot",
    fields: ["id", "product.title"],
    filters: { id: ids },
  })
  const descriptions = new Map<string, string>()
  for (const auction of auctions as AuctionRow[]) {
    const first = [...(auction.lots ?? [])].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    )[0]
    const title = first?.product?.title
    if (title) {
      descriptions.set(auction.id, title)
    }
  }
  for (const lot of lots as LotTitleRow[]) {
    const title = lot.product?.title
    if (title) {
      descriptions.set(lot.id, title)
    }
  }
  return descriptions
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

  const auctionIds = [
    ...new Set(
      page
        .filter(
          (t) => AUCTION_REFERENCE_TYPES.has(t.type as string) && t.reference
        )
        .map((t) => t.reference as string)
    ),
  ]
  const auctionLabels = auctionIds.length
    ? await referenceDescriptions(scope, auctionIds)
    : new Map<string, string>()

  return {
    balance: await walletBalance(scope, walletId),
    transactions: page.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      reference: t.reference ?? null,
      description: AUCTION_REFERENCE_TYPES.has(t.type as string)
        ? (auctionLabels.get(t.reference as string) ?? null)
        : (t.reference ?? null),
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
