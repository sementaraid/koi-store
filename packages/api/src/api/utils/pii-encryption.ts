import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  decryptPiiFields,
  encryptPii,
  PII_FIELDS,
} from "../../utils/pii-crypto"

// US-092 T-092.1 (D-043): the two halves of column-level encryption. Every PII
// column is written by Medusa's or Mercur's own route, so the write point is a
// middleware on the validated body: the route then stores ciphertext without
// knowing it. The read point is `res.json`, and it is registered *after*
// `mask-response`, so it runs first (wrapper order is inner-to-outer) — the
// masks are still computed from the full value, as before.
//
// A full value leaves the server only through the existing reveal routes or the
// owner's own record (D-045), unchanged.
//
// This is a storage transform, not the workflow's mutation: the route's own
// workflow still performs the write, all-or-nothing.

type PlainObject = Record<string, unknown>

const isPlainObject = (value: unknown): value is PlainObject => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const isPiiField = (field: string) =>
  (PII_FIELDS as readonly string[]).includes(field)

// Recurses so `payment_details.account_number` is covered too.
const encryptDeep = (node: unknown): void => {
  if (!isPlainObject(node)) return
  for (const [field, value] of Object.entries(node)) {
    if (isPiiField(field) && typeof value === "string") {
      node[field] = encryptPii(value)
    } else {
      encryptDeep(value)
    }
  }
}

// `encryptPii` is idempotent, so an already-encrypted value (the customer's
// phone copied onto a new seller, D-016) is left as it is. Null and blank stay
// as they are: the field's own validator decides whether a blank is allowed.
export const encryptPiiBody = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    encryptDeep(req.body)
    encryptDeep(req.validatedBody)
    next()
  } catch (error) {
    next(error)
  }
}

export const decryptPiiResponse = (
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const sendJson = res.json.bind(res)
  res.json = ((body: unknown) => sendJson(decryptPiiFields(body))) as typeof res.json
  next()
}

// The farm Custom Fields under `additional_data`, which Mercur's
// `sellerAccountCreated` hook upserts separately from the seller row. The KTP
// photo key is a private file key (D-040), not a value, and stays as it is.
export const encryptFarmCustomFields = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    for (const body of [req.body, req.validatedBody]) {
      if (!isPlainObject(body)) continue
      const farm = body.additional_data
      if (isPlainObject(farm) && typeof farm.ktp_nik === "string") {
        farm.ktp_nik = encryptPii(farm.ktp_nik)
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}
