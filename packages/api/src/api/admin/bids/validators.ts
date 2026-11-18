import { z } from "@medusajs/framework/zod"

// US-072 T-072.1a (AC1, D-024, D-055): the admin's written reason, required and
// non-blank. Read as unknown like the strike/claim validators, because Medusa's
// zod wrapper rewrites a missing or `too_small` issue into English; the
// `refine` (issue code `custom`) keeps this Indonesian message.
export const AdminRemoveBid = z
  .object({
    reason: z
      .unknown()
      .transform((value) => (typeof value === "string" ? value.trim() : ""))
      .refine((value) => value.length > 0, {
        message: "Alasan penghapusan wajib diisi.",
      }),
  })
  .strict()

export type AdminRemoveBidType = z.infer<typeof AdminRemoveBid>
