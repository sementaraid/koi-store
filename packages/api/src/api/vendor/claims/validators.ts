import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { CLAIM_STATUSES, type ClaimStatus } from "../../../modules/moderation/models/claim"

// US-054 T-054.1b: the farmer's own claims, optionally one status.
// Same page bounds as the sold-lots list.
export const VendorGetClaimsParams = z.object({
  status: z.enum(CLAIM_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type VendorGetClaimsParamsType = z.infer<typeof VendorGetClaimsParams>

// Mercur already owns `GET /vendor/claims` (order claims) with a strict query
// validator that 400s an unknown `status` key, and its middlewares run before
// any project entry for the same path. A method-less matcher is global, so it
// runs first: it stashes `?status=` and removes the key before Mercur's
// validator sees the request. The route reads the stashed value here.
// ponytail: a WeakMap, one entry per request, no cleanup needed. Move to a
// request property if a second route ever needs it.
const vendorClaimStatus = new WeakMap<object, ClaimStatus>()

// D-055: an unknown status is the app's mistake, so 400 with Indonesian copy.
export const captureVendorClaimStatus = (
  req: { query: Record<string, unknown> },
  _res: unknown,
  next: (err?: unknown) => void
) => {
  if (req.query.status === undefined) return next()
  const parsed = z.enum(CLAIM_STATUSES).safeParse(req.query.status)
  if (!parsed.success) {
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, "Status klaim tidak valid."))
  }
  vendorClaimStatus.set(req, parsed.data)
  delete req.query.status
  next()
}

export const readVendorClaimStatus = (req: object): ClaimStatus | undefined =>
  vendorClaimStatus.get(req)
