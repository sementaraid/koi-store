import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  readHasShippingAddress,
  readWonLotExtras,
  toWonLot,
  WON_LOT_FIELDS,
  WON_LOT_STATUSES,
  type StoreWonLotResponse,
} from "../route"

// US-051 T-051.6 / US-053 T-053.2: one of the caller's own won lots. Another
// customer's lot is 404 (no existence leak), same as delivered/route.ts.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<StoreWonLotResponse>
) => {
  const customerId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [
    {
      data: [row],
    },
    has_shipping_address,
  ] = await Promise.all([
    query.graph({
      entity: "lot",
      fields: WON_LOT_FIELDS,
      filters: {
        id: req.params.id,
        winner_customer_id: customerId,
        status: [...WON_LOT_STATUSES],
      },
    }),
    readHasShippingAddress(query, customerId),
  ])

  if (!row) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Lot ${req.params.id} was not found`
    )
  }

  // US-054 T-054.1b: claim window end + the caller's own claim on this lot.
  const extras = await readWonLotExtras(query, [row], customerId)

  res.json({
    lot: toWonLot(row, extras.get(row.id as string) ?? {
      claim_window_ends_at: null,
      claim: null,
      rating: null,
      seller_bank: null,
    }),
    has_shipping_address,
  })
}
