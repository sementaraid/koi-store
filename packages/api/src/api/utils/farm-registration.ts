import type { MedusaNextFunction, MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

// US-020 (T-020.1/T-020.5/T-020.6/T-020.7/T-020.8). Shared by the route
// middleware and the `createSellerAccountWorkflow` validate hook.

// T-020.5: the KTP photo is uploaded with access "private" (D-017/D-018), so
// its provider key starts with "private-". A URL or public key is refused.
export const KTP_FILE_KEY_PREFIX = "private-"

export const FARM_NIK_PATTERN = /^\d{16}$/
// Up to six farm photos in one registration; enough for the admin review.
export const FARM_PHOTO_MAX = 6

// T-020.1: the farm's Custom Fields (Mercur custom-fields doc), carried under
// `additional_data` on POST /vendor/sellers. Registered with
// `additionalDataValidator` so Mercur's WithAdditionalData schema accepts the
// keys; the values are persisted by the `sellerAccountCreated` hook.
export const FarmRegistrationAdditionalData = {
  ktp_photo_key: z
    .string()
    .startsWith(KTP_FILE_KEY_PREFIX, "ktp_photo_key must be a private upload key"),
  ktp_nik: z.string().regex(FARM_NIK_PATTERN, "ktp_nik must be 16 digits"),
  farm_photo_urls: z
    .array(z.string().url())
    .min(1, "at least one farm photo is required")
    .max(FARM_PHOTO_MAX),
}

export const FarmRegistration = z.object(FarmRegistrationAdditionalData)

export type FarmRegistrationAdditionalData = z.infer<typeof FarmRegistration>

type RegistrationBody = {
  address?: {
    address_1?: string | null
    city?: string | null
    province?: string | null
  } | null
  payment_details?: {
    holder_name?: string | null
    bank_name?: string | null
    account_number?: string | null
  } | null
  additional_data?: Record<string, unknown>
}

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0

// AC1 (D-017): the location, bank account and KTP identity are required.
// Mercur already requires name and email. Called inside the workflow's
// `validate` hook, so it aborts before any seller or member is written.
export const assertFarmRegistrationFields = (input: RegistrationBody) => {
  const missing: string[] = []

  if (!hasText(input.address?.address_1)) missing.push("address.address_1")
  if (!hasText(input.address?.city)) missing.push("address.city")
  if (!hasText(input.payment_details?.holder_name)) {
    missing.push("payment_details.holder_name")
  }
  if (!hasText(input.payment_details?.bank_name)) {
    missing.push("payment_details.bank_name")
  }
  if (!hasText(input.payment_details?.account_number)) {
    missing.push("payment_details.account_number")
  }

  const farm = input.additional_data ?? {}
  if (!hasText(farm.ktp_photo_key)) missing.push("additional_data.ktp_photo_key")
  if (!hasText(farm.ktp_nik) || !FARM_NIK_PATTERN.test(farm.ktp_nik)) {
    missing.push("additional_data.ktp_nik (16 digits)")
  }
  if (!Array.isArray(farm.farm_photo_urls) || farm.farm_photo_urls.length < 1) {
    missing.push("additional_data.farm_photo_urls (at least one)")
  }

  if (missing.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Farm registration is missing: ${missing.join(", ")}`
    )
  }
}

// T-020.8 (D-008/D-016): the farm's WhatsApp number is the customer's
// registration phone, copied from the customer record, never from the body. A
// phone in the body is overwritten (ignored). Runs after Mercur's body
// validator on the same matcher, so it edits the validated body the route
// reads, and before the workflow.
export const copyCustomerPhoneToSeller = async (
  req: MedusaRequest & { auth_context?: { app_metadata?: Record<string, unknown> } },
  _res: unknown,
  next: MedusaNextFunction
) => {
  try {
    const body = (req.validatedBody ?? req.body) as
      | (Record<string, unknown> & RegistrationBody)
      | undefined
    if (!body) {
      return next()
    }

    const farm = body.additional_data
    if (!farm || typeof farm !== "object") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "additional_data with the farm registration fields is required"
      )
    }

    const customerId = req.auth_context?.app_metadata?.customer_id
    if (typeof customerId !== "string" || !customerId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Lengkapi profil akun Anda sebelum mendaftarkan kebun."
      )
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "phone"],
      filters: { id: customerId },
    })

    if (!customer?.phone) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Tambahkan nomor WhatsApp di akun Anda sebelum mendaftarkan kebun."
      )
    }

    body.phone = customer.phone
    next()
  } catch (error) {
    next(error)
  }
}
