import { z } from "@medusajs/framework/zod"

// D-008: the registration phone is required and is the account's WhatsApp
// number. Same rule as storefront-koi registerSchema (AuthPage/components/
// schema.ts): trim, strip spaces and dashes, then 6–20 chars of `+?digits`.
export const StorePhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(
    z
      .string()
      .min(6, "phone is required")
      .max(20, "phone must be at most 20 digits")
      .regex(/^\+?\d+$/, "phone may only contain digits and a leading +")
  )
