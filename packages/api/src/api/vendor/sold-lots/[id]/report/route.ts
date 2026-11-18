import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  reportUnpaidLotWorkflow,
  type ReportUnpaidLotResult,
} from "../../../../../workflows/report-unpaid-lot"
import "../../../../../types/seller-context"

export type VendorLotReportResponse = { report: ReportUnpaidLotResult }

// US-058 T-058.1 (AC1, AC2, D-026, D-058, D-055): the farmer reports a winner
// who didn't pay within 1×24 h of the close. Body-less; identity from
// `req.seller_context` (D-003). 403 a not-open farm (`validateSellerOpenStep`);
// 404 another farm's lot or an unknown one; 409 `lot_not_payable`,
// `pay_deadline_not_passed` or `lot_already_reported` (Medusa rewrites a 409
// body's code, so Koi apps key on the status). The report changes no lot.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorLotReportResponse>
) => {
  // Strict empty body: a client can't send a status, a lot id or a seller id.
  if (Object.keys((req.body as Record<string, unknown>) ?? {}).length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Lapor belum dibayar tidak memakai body."
    )
  }

  const { result } = await reportUnpaidLotWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      lot_id: req.params.id,
    },
  })

  res.status(201).json({ report: result })
}
