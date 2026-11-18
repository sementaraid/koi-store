import { z } from "@medusajs/framework/zod"

// US-057 T-057.1 AC1, mvp-Q48. Medusa's zod validator rewrites `invalid_type`
// issues into English, so the fields are narrowed by `refine` (issue code
// `custom`), whose Indonesian message survives `validateAndTransformBody`
// (same shape as admin/strikes/validators.ts). Whole stars 1–5, comment
// optional and at most 300 characters.
export const StoreRateLot = z
  .object({
    stars: z
      .unknown()
      .refine(
        (value) =>
          typeof value === "number" &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 5,
        { message: "Bintang harus bilangan bulat 1 sampai 5." }
      )
      .transform((value) => value as number),
    comment: z
      .unknown()
      .optional()
      .refine(
        (value) =>
          value === undefined || value === null || typeof value === "string",
        { message: "Komentar harus berupa teks." }
      )
      .refine(
        (value) => typeof value !== "string" || value.trim().length <= 300,
        { message: "Komentar maksimal 300 karakter." }
      )
      // Whitespace-only is no comment.
      .transform((value) =>
        typeof value === "string" && value.trim().length ? value.trim() : null
      ),
  })
  .strict()

export type StoreRateLotType = z.infer<typeof StoreRateLot>
