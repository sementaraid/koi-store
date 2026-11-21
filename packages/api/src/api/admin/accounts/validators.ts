import { z } from "@medusajs/framework/zod"

// US-070 T-070.1a: the /pengguna list. `q` searches name or email; absent lists
// everyone. Medusa's zod wrapper rewrites a `too_big` issue into English, so the
// >100 case is narrowed by `refine` (issue code `custom`), whose Indonesian
// message survives (D-055).
export const AdminGetAccountsParams = z.object({
  q: z
    .string()
    .trim()
    .refine((value) => value.length <= 100, {
      message: "Kata kunci terlalu panjang.",
    })
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type AdminGetAccountsParamsType = z.infer<typeof AdminGetAccountsParams>
