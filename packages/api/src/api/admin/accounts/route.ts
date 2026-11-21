import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { SellerStatus } from "@mercurjs/types"
import { maskPhone } from "../../../utils/mask"
import { decryptPii } from "../../../utils/pii-crypto"
import {
  readActiveStrikeCounts,
  type StrikeCount,
} from "../../../utils/strike"
import type { AdminGetAccountsParamsType } from "./validators"

// US-070 T-070.1a (AC1, D-002, D-037, D-042, D-045, D-058): the admin-koi
// /pengguna list. Medusa's /admin auth refuses any non-admin actor before this
// runs. Name and email are full (D-042's masked set is phone, NIK and bank);
// the phone is masked here and reaches the admin in full only through
// POST /admin/customers/:id/reveal. The ban is derived, never stored.
export type AdminAccountFarm = { id: string; name: string; status: SellerStatus }

export type AdminAccount = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  balance: number
  active_strikes: number
  banned: boolean
  farm: AdminAccountFarm | null
}

export type AdminAccountsResponse = {
  accounts: AdminAccount[]
  count: number
  limit: number
  offset: number
}

export const ADMIN_ACCOUNT_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "created_at",
  "wallet.id",
]

export type AdminAccountRow = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  created_at: Date | string
  wallet?: { id: string } | null
}

// One batched read for the page's wallets, summed in memory. Never per row
// (`walletBalance` would be one query per customer).
export const balancesByWalletId = async (
  container: MedusaContainer,
  walletIds: string[]
): Promise<Map<string, number>> => {
  const amounts = new Map<string, number>()
  const ids = [...new Set(walletIds)]
  if (!ids.length) return amounts

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "wallet_transaction",
    fields: ["wallet_id", "amount"],
    filters: { wallet_id: ids },
  })
  for (const row of data as { wallet_id: string; amount: number | string }[]) {
    amounts.set(
      row.wallet_id,
      (amounts.get(row.wallet_id) ?? 0) + Number(row.amount)
    )
  }
  return amounts
}

// One batched read for the page's farms: the seller whose member email is one
// of these customers' emails (D-003, one identity holds the customer and the
// member).
export const farmsByEmail = async (
  container: MedusaContainer,
  emails: string[]
): Promise<Map<string, AdminAccountFarm>> => {
  const farms = new Map<string, AdminAccountFarm>()
  const wanted = [...new Set(emails.map((e) => e.toLowerCase()))]
  if (!wanted.length) return farms

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "status", "members.email"],
    filters: { members: { email: { $in: wanted } } },
  })

  for (const row of data as {
    id: string
    name: string
    status: SellerStatus
    members?: { email?: string | null }[] | null
  }[]) {
    for (const member of row.members ?? []) {
      const email = member.email?.toLowerCase()
      if (email && wanted.includes(email)) {
        farms.set(email, { id: row.id, name: row.name, status: row.status })
      }
    }
  }
  return farms
}

export const toAdminAccounts = async (
  container: MedusaContainer,
  rows: AdminAccountRow[]
): Promise<AdminAccount[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const ids = rows.map((row) => row.id)
  const emails = rows
    .map((row) => row.email)
    .filter((email): email is string => !!email)

  const [balances, farms, strikes] = await Promise.all([
    balancesByWalletId(
      container,
      rows.map((row) => row.wallet?.id).filter((id): id is string => !!id)
    ),
    farmsByEmail(container, emails),
    readActiveStrikeCounts(query, ids),
  ])

  return rows.map((row) => {
    const strikesFor: StrikeCount | undefined = strikes.get(row.id)
    const email = row.email?.toLowerCase()
    return {
      id: row.id,
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      email: row.email ?? null,
      // D-043: the column is ciphertext; mask the plaintext.
      phone: maskPhone(decryptPii(row.phone)) ?? null,
      created_at: new Date(row.created_at).toISOString(),
      balance: row.wallet?.id ? (balances.get(row.wallet.id) ?? 0) : 0,
      active_strikes: strikesFor?.active_count ?? 0,
      banned: strikesFor?.banned ?? false,
      farm: (email && farms.get(email)) || null,
    }
  })
}

// Newest first: an admin looking for a new account finds it at the top.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAccountsParamsType>,
  res: MedusaResponse<AdminAccountsResponse>
) => {
  const { q, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "customer",
    fields: ADMIN_ACCOUNT_FIELDS,
    filters: q && q.length
      ? {
          $or: [
            { email: { $ilike: `%${q}%` } },
            { first_name: { $ilike: `%${q}%` } },
            { last_name: { $ilike: `%${q}%` } },
          ],
        }
      : {},
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({
    accounts: await toAdminAccounts(req.scope, data as AdminAccountRow[]),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
