import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SellerStatus } from "@mercurjs/types"
import type { StoreGetRatingsParamsType } from "./validators"

// US-057 T-057.1b AC2 (D-039, D-042, D-045, D-046, D-061): the public rating
// list behind the farm page (`mitra/[handle]`). Publishable key only, no
// customer identity. A non-`open` seller is 404, same as `GET /store/sellers`.
// The rater is a first name only: never an id, phone, email or NIK.
export type StoreRatingRow = {
  id: string
  stars: number
  comment: string | null
  created_at: string
  rater: { name: string }
}

export type StoreRatingsResponse = {
  // Mean of every rating on the farm, one decimal; null when count is 0.
  average: number | null
  count: number
  ratings: StoreRatingRow[]
  limit: number
  offset: number
}

type RatingRow = {
  id: string
  stars: number
  comment: string | null
  created_at: Date | string
  customer_id: string
}

const toOneDecimal = (sum: number, count: number) =>
  Math.round((sum / count) * 10) / 10

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, StoreGetRatingsParamsType>,
  res: MedusaResponse<StoreRatingsResponse>
) => {
  const { seller_id, limit = 10, offset = 0 } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "status"],
    filters: { id: seller_id },
  })
  if (!seller || seller.status !== SellerStatus.OPEN) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Mitra tidak ditemukan.")
  }

  const { data, metadata } = await query.graph({
    entity: "farmer_rating",
    fields: ["id", "stars", "comment", "created_at", "customer_id"],
    filters: { seller_id },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })
  const rows = data as RatingRow[]
  const count = metadata?.count ?? 0

  // The average covers every rating, not just this page. ponytail: one extra
  // read of `stars` for the whole farm — fine for an MVP farm; replace with a
  // SQL aggregate if a farm ever passes a few thousand ratings.
  let average: number | null = null
  if (count > 0) {
    const { data: all } = await query.graph({
      entity: "farmer_rating",
      fields: ["stars"],
      filters: { seller_id },
      pagination: { take: count },
    })
    average = toOneDecimal(
      (all as { stars: number }[]).reduce((sum, row) => sum + Number(row.stars), 0),
      count
    )
  }

  // D-042/D-045: one batched read for the page's raters, first name only.
  const ids = [...new Set(rows.map((row) => row.customer_id))]
  const { data: customers } = ids.length
    ? await query.graph({
        entity: "customer",
        fields: ["id", "first_name"],
        filters: { id: ids },
      })
    : { data: [] }
  const firstNameById = new Map(
    (customers as { id: string; first_name?: string | null }[]).map((c) => [
      c.id,
      c.first_name?.trim() || "",
    ])
  )

  res.json({
    average,
    count,
    ratings: rows.map((row) => ({
      id: row.id,
      stars: Number(row.stars),
      comment: row.comment ?? null,
      created_at: new Date(row.created_at).toISOString(),
      rater: { name: firstNameById.get(row.customer_id) ?? "" },
    })),
    limit,
    offset,
  })
}
