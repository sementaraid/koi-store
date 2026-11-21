import { z } from "@medusajs/framework/zod"

// US-072 T-072.1a (AC1, D-024, D-055): the admin's written reason, required,
// non-blank and at most 500 characters (mvp-Q52). Read as unknown like the
// strike/claim validators, because Medusa's zod wrapper rewrites a missing or
// `too_small` issue into English; the `refine` (issue code `custom`) keeps this
// Indonesian message.
export const AdminRemoveBid = z
  .object({
    reason: z
      .unknown()
      .transform((value) => (typeof value === "string" ? value.trim() : ""))
      .refine((value) => value.length > 0, {
        message: "Alasan penghapusan wajib diisi.",
      })
      .refine((value) => value.length <= 500, {
        message: "Alasan maksimal 500 karakter.",
      }),
  })
  .strict()

export type AdminRemoveBidType = z.infer<typeof AdminRemoveBid>
