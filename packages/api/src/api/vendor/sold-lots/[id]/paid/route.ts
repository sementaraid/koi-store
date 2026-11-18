import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { markLotPaidWorkflow } from "../../../../../workflows/mark-lot-sold-status"
import {
  SOLD_LOT_FIELDS,
  toSoldLots,
  type SoldLot,
} from "../../route"
import "../../../../../types/seller-context"

export type VendorMarkPaidResponse = { lot: SoldLot }

// US-052 T-052.4 (AC1, AC4, D-054, D-058): `won → paid` only. The winner paid
// the farmer off-platform; no wallet, no ledger, no payout moves here.
// Identity from `req.seller_context` (D-003). 404 another seller's lot or an
// unknown one; 403 `seller_terminated`; 409 wrong status (Medusa rewrites a
// 409 body's code, so Koi apps key on the status).
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorMarkPaidResponse>
) => {
  // Strict empty body: a client can't send a status or a seller id.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Tandai dibayar tidak memakai body."
    )
  }

  await markLotPaidWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      lot_id: req.params.id,
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
