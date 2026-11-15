import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  maskAccountNumber,
  maskName,
  maskNik,
  maskPhone,
} from "../../utils/mask"

// US-092 T-092.2 (D-039, D-042). A response-level mask for Mercur's and
// Medusa's own routes, which a query-level `req.disallowed` can't cover: a
// `*relation` field selects a relation's scalar columns (a seller's `phone`
// rides along in `seller.*`), and Mercur's `/vendor/customers` builds its query
// config after ours and overwrites `req.disallowed`.
//
// Rule (owner, 2026-11-15): full PII only to the person it belongs to, on their
// own record; everyone else, admins included, gets the mask. So the customer's
// own phone/address stays full on /store/customers and /store/carts, the
// farmer's own record stays full on /vendor/sellers*, and the logged reveal
// stays full on /admin/farms/:id/reveal. Everything else is masked.

const PAYMENT_DETAIL_MASKS: Record<
  string,
  (value?: string | null) => string | null
> = {
  holder_name: maskName,
  account_number: maskAccountNumber,
  iban: maskAccountNumber,
  routing_number: maskAccountNumber,
}

const isPlainObject = (value: object) => {
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

// A value that already carries a mask (`*`) came from a route that masked it
// itself (e.g. the farm queue); masking it twice would change the mask. A real
// phone, NIK or account number never contains `*`.
const applyMask = (
  mask: (value?: string | null) => string | null,
  value: unknown
) =>
  typeof value === "string" && value.includes("*")
    ? value
    : mask(value as string | null | undefined)

const maskPaymentDetails = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(maskPaymentDetails)
  if (!value || typeof value !== "object") return value
  const details = value as Record<string, unknown>
  const masked = { ...details }
  for (const [field, mask] of Object.entries(PAYMENT_DETAIL_MASKS)) {
    if (field in details) {
      masked[field] = applyMask(mask, details[field])
    }
  }
  return masked
}

// Deep copy with every `phone` string masked and every `payment_details` object
// masked. Idempotent: an already-masked value keeps its shape. Non-plain values
// (Date, Buffer) pass through so a response keeps what it serialized. Returns
// the original object when nothing inside it needed a mask, so catalog responses
// cost one traversal and no allocation.
const maskPii = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    let changed = false
    const masked = value.map((child) => {
      const next = maskPii(child)
      changed ||= next !== child
      return next
    })
    return changed ? masked : value
  }
  if (!value || typeof value !== "object" || !isPlainObject(value)) return value

  let changed = false
  const masked: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    let next = child
    if (key === "phone" && typeof child === "string") {
      next = applyMask(maskPhone, child)
    } else if (key === "ktp_nik" && typeof child === "string") {
      // The farm Custom Field's NIK reaches a seller row only through a
      // `custom_fields` walk; mask it on every non-self response too.
      next = applyMask(maskNik, child)
    } else if (key === "payment_details") {
      next = maskPaymentDetails(child)
    } else {
      next = maskPii(child)
    }
    changed ||= next !== child
    masked[key] = next
  }
  return changed ? masked : value
}

// A customer only ever sees a seller as someone else's record (orders,
// offers, the directory), so every `seller`/`sellers` value is masked while the
// caller's own customer, cart and address data stays full. Same
// return-the-original fast path as `maskPii`.
const maskSellerRelations = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    let changed = false
    const masked = value.map((child) => {
      const next = maskSellerRelations(child)
      changed ||= next !== child
      return next
    })
    return changed ? masked : value
  }
  if (!value || typeof value !== "object" || !isPlainObject(value)) return value

  let changed = false
  const masked: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next =
      key === "seller" || key === "sellers" ? maskPii(child) : maskSellerRelations(child)
    changed ||= next !== child
    masked[key] = next
  }
  return changed ? masked : value
}

/**
 * Wrap `res.json` so the body leaves transformed. `skip` gets the path as
 * Express sees it inside the mount ("/farms/x/reveal" for /admin); true leaves
 * the response untouched.
 */
const maskResponse =
  (
    transform: (body: unknown) => unknown,
    skip: (path: string) => boolean = () => false
  ) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    if (skip(req.path)) return next()
    const sendJson = res.json.bind(res)
    res.json = ((body: unknown) => sendJson(transform(body))) as typeof res.json
    next()
  }

// US-092 T-092.5 (D-042): the logged reveal is the one way a full value leaves
// the server for an admin.
const isAdminRevealPath = (path: string) => /^\/farms\/[^/]+\/reveal$/.test(path)

// A seller's own record, on the farmer's own member token. The storefront
// prefills the registration phone and reads the seller's own bank details there
// (owner, 2026-11-15 self-view exception; D-003).
const isVendorSelfPath = (path: string) => /^\/sellers(\/|$)/.test(path)

export const storePiiMask = maskResponse(maskSellerRelations)
export const adminPiiMask = maskResponse(maskPii, isAdminRevealPath)
export const vendorPiiMask = maskResponse(maskPii, isVendorSelfPath)
