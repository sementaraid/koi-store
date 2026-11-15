import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createFeeCategoriesWorkflow } from "../workflows/fee-categories"

// US-014 AC2 / plan.md "Starting fee table (approved)". Whole rupiah.
export const APPROVED_FEE_CATEGORIES = [
  { name: "Lokal, no certificate", listing_fee: 50_000, join_fee: 100_000 },
  { name: "Lokal, certificate", listing_fee: 100_000, join_fee: 250_000 },
  { name: "Import, certificate", listing_fee: 200_000, join_fee: 500_000 },
  { name: "Premium", listing_fee: 400_000, join_fee: 1_000_000 },
]

// Called by seed-koi.ts. Creates only the categories whose name is missing, so
// a re-run never duplicates rows or overwrites an admin's edited fees.
export async function seedFeeCategories(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({
    entity: "fee_category",
    fields: ["name"],
  })
  const names = new Set(existing.map((c) => c.name))
  const missing = APPROVED_FEE_CATEGORIES.filter((c) => !names.has(c.name))

  if (missing.length) {
    await createFeeCategoriesWorkflow(container).run({
      input: { fee_categories: missing },
    })
  }
  return missing.length
}
