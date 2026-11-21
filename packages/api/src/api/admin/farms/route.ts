import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type { SellerStatus } from "@mercurjs/types"
import type { AdminGetFarmsParamsType } from "./validators"
import { maskAccountNumber, maskName, maskNik, maskPhone } from "../../../utils/mask"
import { decryptPii } from "../../../utils/pii-crypto"

// US-021 T-021.1 (AC1). Admin only (D-002): Medusa's /admin auth refuses any
// other actor before this runs. The private registration data (D-017) is read
// here and nowhere public; the KTP photo is never a URL, only `has_ktp_photo`
// plus GET /admin/farms/:id/ktp.
// US-092 T-092.2 (D-042): NIK, account number, holder name and both phones are
// masked here; the full value only comes from POST /admin/farms/:id/reveal.

// The Koi account behind the farm (D-003: one auth identity holds the member
// and the customer). Its name is what the admin compares with the bank
// account's holder_name.
export type AdminFarmApplicant = {
  customer_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
}

export type AdminFarm = {
  id: string
  name: string
  email: string
  phone: string | null
  description: string | null
  status: SellerStatus
  status_reason: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  address: {
    address_1: string | null
    city: string | null
    province: string | null
  } | null
  payment_details: {
    holder_name: string | null
    bank_name: string | null
    account_number: string | null
  } | null
  ktp_nik: string | null
  has_ktp_photo: boolean
  farm_photo_urls: string[]
  applicant: AdminFarmApplicant | null
  // AC1's holder-vs-applicant check, done on the full values server-side
  // because both are masked. null: holder name or applicant name missing.
  holder_matches_applicant: boolean | null
}

export type AdminFarmsResponse = {
  farms: AdminFarm[]
  count: number
  limit: number
  offset: number
}

export const ADMIN_FARM_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "description",
  "status",
  "status_reason",
  "approved_at",
  "rejected_at",
  "created_at",
  "address.address_1",
  "address.city",
  "address.province",
  "payment_details.holder_name",
  "payment_details.bank_name",
  "payment_details.account_number",
  "custom_fields.ktp_photo_key",
  "custom_fields.ktp_nik",
  "custom_fields.farm_photo_urls",
  "members.email",
]

export type AdminFarmRow = {
  id: string
  name: string
  email: string
  phone?: string | null
  description?: string | null
  status: SellerStatus
  status_reason?: string | null
  approved_at?: Date | string | null
  rejected_at?: Date | string | null
  created_at: Date | string
  address?: AdminFarm["address"]
  payment_details?: AdminFarm["payment_details"]
  custom_fields?: {
    ktp_photo_key?: string | null
    ktp_nik?: string | null
    farm_photo_urls?: string[] | null
  } | null
  members?: { email: string }[] | null
}

const iso = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString() : null

// A registration has one member, the owner who signed up (createSellerAccountWorkflow).
export const memberEmailOf = (row: AdminFarmRow) => row.members?.[0]?.email?.toLowerCase()

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase()

// Same rule admin-koi's holderMatchesApplicant used: full name, case- and
// space-insensitive.
export const holderMatchesApplicant = (
  holderName: string | null | undefined,
  applicant: Pick<AdminFarmApplicant, "first_name" | "last_name"> | null | undefined
): boolean | null => {
  if (!holderName?.trim() || !applicant) return null
  const name = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ")
  if (!name.trim()) return null
  return normalizeName(holderName) === normalizeName(name)
}

// Member email → the customer on the same auth identity (D-003). Two batched
// reads for the whole page.
export const applicantsByEmail = async (
  container: MedusaContainer,
  emails: string[]
): Promise<Map<string, AdminFarmApplicant>> => {
  const result = new Map<string, AdminFarmApplicant>()
  if (!emails.length) return result

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: identities } = await query.graph({
    entity: "provider_identity",
    fields: ["entity_id", "auth_identity.app_metadata"],
    filters: { provider: "emailpass", entity_id: emails },
  })

  const customerIdByEmail = new Map<string, string>()
  for (const pi of identities as {
    entity_id: string
    auth_identity?: { app_metadata?: Record<string, unknown> | null } | null
  }[]) {
    const customerId = pi.auth_identity?.app_metadata?.customer_id
    if (typeof customerId === "string") {
      customerIdByEmail.set(pi.entity_id.toLowerCase(), customerId)
    }
  }
  if (!customerIdByEmail.size) return result

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "phone"],
    filters: { id: [...customerIdByEmail.values()] },
  })
  const byId = new Map(customers.map((c) => [c.id, c]))

  for (const [email, id] of customerIdByEmail) {
    const c = byId.get(id)
    if (c) {
      result.set(email, {
        customer_id: c.id,
        email: c.email ?? null,
        first_name: c.first_name ?? null,
        last_name: c.last_name ?? null,
        phone: decryptPii(c.phone),
      })
    }
  }
  return result
}

export const toAdminFarms = async (
  container: MedusaContainer,
  rows: AdminFarmRow[]
): Promise<AdminFarm[]> => {
  const emails = rows.map(memberEmailOf).filter((e): e is string => !!e)
  const applicants = await applicantsByEmail(container, emails)

  return rows.map((r) => {
    const email = memberEmailOf(r)
    const applicant = (email && applicants.get(email)) || null
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      // D-043: the columns are ciphertext; mask the plaintext.
      phone: maskPhone(decryptPii(r.phone)),
      description: r.description ?? null,
      status: r.status,
      status_reason: r.status_reason ?? null,
      approved_at: iso(r.approved_at),
      rejected_at: iso(r.rejected_at),
      created_at: new Date(r.created_at).toISOString(),
      address: r.address
        ? {
            address_1: r.address.address_1 ?? null,
            city: r.address.city ?? null,
            province: r.address.province ?? null,
          }
        : null,
      payment_details: r.payment_details
        ? {
            holder_name: maskName(decryptPii(r.payment_details.holder_name)),
            bank_name: r.payment_details.bank_name ?? null,
            account_number: maskAccountNumber(
              decryptPii(r.payment_details.account_number)
            ),
          }
        : null,
      ktp_nik: maskNik(decryptPii(r.custom_fields?.ktp_nik)),
      has_ktp_photo: !!r.custom_fields?.ktp_photo_key,
      farm_photo_urls: r.custom_fields?.farm_photo_urls ?? [],
      applicant: applicant && {
        ...applicant,
        phone: maskPhone(applicant.phone),
      },
      // The holder-vs-applicant check is on full values, so decrypt the holder.
      holder_matches_applicant: holderMatchesApplicant(
        decryptPii(r.payment_details?.holder_name),
        applicant
      ),
    }
  })
}

// The queue: oldest registration first, so the admin works in arrival order.
export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetFarmsParamsType>,
  res: MedusaResponse<AdminFarmsResponse>
) => {
  const { status, limit = 20, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data, metadata } = await query.graph({
    entity: "seller",
    fields: ADMIN_FARM_FIELDS,
    filters: { status },
    pagination: { skip: offset, take: limit, order: { created_at: "ASC" } },
  })

  res.json({
    farms: await toAdminFarms(req.scope, data as AdminFarmRow[]),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
