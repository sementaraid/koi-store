import type {
  MedusaContainer,
  RemoteQueryFunction,
} from "@medusajs/framework/types"
import { applicantsByEmail } from "../api/admin/farms/route"

// US-059 (AC2, AC3): the strike window and the derived ban. Expiry is computed,
// never a stored flag, so removing or ageing a strike lifts the ban with no
// separate action.
export const STRIKE_WINDOW_DAYS = 180

const WINDOW_MS = STRIKE_WINDOW_DAYS * 24 * 60 * 60 * 1000

type Query = Omit<RemoteQueryFunction, symbol>

export type StrikeCount = { active_count: number; banned: boolean }

type StrikeRowLite = {
  customer_id: string
  removed_at: Date | string | null
  created_at: Date | string
}

// Active = not removed and newer than 180 days. Exactly 180 days old is
// expired.
export const isActiveStrike = (
  row: { removed_at: Date | string | null; created_at: Date | string },
  now: Date
): boolean =>
  row.removed_at === null &&
  new Date(row.created_at).getTime() > now.getTime() - WINDOW_MS

// AC2: 2 active strikes = ban.
export const isBanned = (activeCount: number): boolean => activeCount >= 2

// One batched read for a whole page's customers (no per-row query). Every
// requested id maps to a count, zero included.
export const readActiveStrikeCounts = async (
  query: Query,
  customerIds: string[],
  now: Date = new Date()
): Promise<Map<string, StrikeCount>> => {
  const counts = new Map<string, StrikeCount>()
  for (const id of new Set(customerIds)) {
    counts.set(id, { active_count: 0, banned: false })
  }
  if (!counts.size) return counts

  const { data } = await query.graph({
    entity: "strike",
    fields: ["customer_id", "removed_at", "created_at"],
    filters: { customer_id: [...counts.keys()] },
  })

  for (const row of data as StrikeRowLite[]) {
    if (!isActiveStrike(row, now)) continue
    const entry = counts.get(row.customer_id)
    if (!entry) continue
    entry.active_count += 1
    entry.banned = isBanned(entry.active_count)
  }
  return counts
}

// D-003: a farm's member account holds the customer. Two batched reads for the
// whole page (the sellers' member emails, then the customers), no per-row query.
export const readSellerCustomerIds = async (
  container: MedusaContainer,
  query: Query,
  sellerIds: string[]
): Promise<Map<string, string>> => {
  const bySeller = new Map<string, string>()
  const ids = [...new Set(sellerIds)]
  if (!ids.length) return bySeller

  const { data } = await query.graph({
    entity: "seller",
    fields: ["id", "members.email"],
    filters: { id: ids },
  })
  const sellers = data as {
    id: string
    members?: { email?: string | null }[] | null
  }[]

  const emailOf = (row: (typeof sellers)[number]) =>
    row.members?.[0]?.email?.toLowerCase()
  const emails = sellers
    .map(emailOf)
    .filter((email): email is string => !!email)
  const applicants = await applicantsByEmail(container, emails)

  for (const row of sellers) {
    const email = emailOf(row)
    const customerId = email ? applicants.get(email)?.customer_id : undefined
    if (customerId) bySeller.set(row.id, customerId)
  }
  return bySeller
}

