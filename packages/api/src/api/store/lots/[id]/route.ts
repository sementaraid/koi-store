import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PUBLIC_AUCTION_STATUSES } from "../validators"
import {
  getPublicLots,
  type StoreLot,
  type StoreLotResponse,
} from "../route"

type StoreLotByIdResponse = StoreLotResponse

// US-040 AC3 (D-046, D-050). 404 when the lot is missing OR its auction isn't
// public, so a draft lot id can't leak. A cancelled lot inside a public auction
// is a 200 with `cancelled: true`.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreLotByIdResponse>
) => {
  const { lots } = await getPublicLots(
    req.scope,
    {
      id: req.params.id,
      auction: { status: PUBLIC_AUCTION_STATUSES },
    },
    1,
    0,
    "ASC"
  )
  const lot: StoreLot | undefined = lots[0]
  if (!lot) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Lot ${req.params.id} was not found`
    )
  }

  res.json({ lot })
}
