import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { markLotShippedWorkflow } from "../../../../../workflows/mark-lot-sold-status"
import {
  SOLD_LOT_FIELDS,
  toSoldLots,
  type SoldLot,
} from "../../route"
import type { VendorMarkLotShippedType } from "../../validators"
import "../../../../../types/seller-context"

export type VendorMarkShippedResponse = { lot: SoldLot }

// US-052 T-052.1 (AC1, AC2, AC4, D-052, D-054): `paid → shipped` only.
// Identity from `req.seller_context` (D-003). 404 another seller's lot or an
// unknown one; 400 `tracking_number_required` for a courier lot; 403
// `seller_terminated`; 409 wrong status (Medusa rewrites a 409 body's code, so
// Koi apps key on the status).
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorMarkLotShippedType>,
  res: MedusaResponse<VendorMarkShippedResponse>
) => {
  await markLotShippedWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      lot_id: req.params.id,
      tracking_number: req.validatedBody?.tracking_number,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "lot",
    fields: SOLD_LOT_FIELDS,
    filters: { id: req.params.id },
  })

  res.json({ lot: (await toSoldLots(req.scope, data))[0] })
}
