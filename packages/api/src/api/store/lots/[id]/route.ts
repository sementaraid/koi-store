import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PUBLIC_AUCTION_STATUSES } from "../validators"
import {
  getPublicLots,
  toStoreBids,
  type StoreLotDetailResponse,
} from "../route"

// US-040 AC3 (D-046, D-050). 404 when the lot is missing OR its auction isn't
// public, so a draft lot id can't leak. A cancelled lot inside a public auction
// is a 200 with `cancelled: true`.
// US-044 (D-051): the detail adds the masked bid history. A cancelled lot has
// no bids (D-050); the rows stay in the DB.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreLotDetailResponse>
) => {
  const { lots, rows } = await getPublicLots(
    req.scope,
    {
      id: req.params.id,
      auction: { status: PUBLIC_AUCTION_STATUSES },
    },
    1,
    0,
    "ASC"
  )
  const lot = lots[0]
  if (!lot) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Lot ${req.params.id} was not found`
    )
  }

  // US-072 T-072.1c (AC2): `toStoreBids` drops removed rows, so the history
  // matches the count. The rows stay in the DB, never in this payload.
  const bidRows =
    (rows[0].bids as
      | {
          id: string
          customer_id: string
          amount: number
          created_at: string
          removed_at?: string | null
        }[]
      | undefined) ?? []

  res.json({
    lot: {
      ...lot,
      bids: lot.cancelled ? [] : await toStoreBids(req.scope, bidRows),
    },
  })
}
