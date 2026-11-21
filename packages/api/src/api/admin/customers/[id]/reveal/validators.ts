import { z } from "@medusajs/framework/zod"

// US-070 T-070.1b (D-042): which customer PII field to reveal. Only the phone
// belongs to this screen; every other field's full value lives elsewhere.
export const CUSTOMER_PII_FIELDS = ["phone"] as const

export type CustomerPiiField = (typeof CUSTOMER_PII_FIELDS)[number]

// Medusa's zod wrapper rewrites `invalid_value` into English, so the field is
// narrowed by `refine` (issue code `custom`), whose Indonesian message
// survives validateAndTransformBody (D-055).
export const AdminRevealCustomerPii = z
  .object({
    field: z
      .unknown()
      .transform((value) => (typeof value === "string" ? value : ""))
      .refine((value) => value === "phone", {
        message: "Kolom yang bisa ditampilkan hanya nomor telepon.",
      })
      .transform(() => "phone" as const),
  })
  .strict()

export type AdminRevealCustomerPiiType = z.infer<typeof AdminRevealCustomerPii>
