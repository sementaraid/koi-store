import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import { PAY_WINDOW_MS } from "../utils/pay-window"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import {
  createLotReportStep,
  getReportableLotStep,
} from "./steps/lot-report"

export type ReportUnpaidLotWorkflowInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  lot_id: string
}

export type ReportUnpaidLotResult = {
  id: string
  lot_id: string
  status: string
  reported_at: string
  pay_by: string
}

// US-058 T-058.1 (AC1, AC2, D-026, D-054, D-058): the farm reports a winner
// who didn't pay within 1×24 h of the close. Lock → farm open → guard (404/409)
// → insert → release. This route is not one of D-054's paid/shipped exceptions,
// so a suspended farm gets 403 (D-054 literal; D-060 does not extend it).
// The report never changes the lot: status stays `won`, winner and final price
// untouched, no reassignment (AC2).
export const reportUnpaidLotWorkflow = createWorkflow(
  "report-unpaid-lot",
  function (input: ReportUnpaidLotWorkflowInput) {
    const lotLock = transform(input, ({ lot_id }) => `lot:${lot_id}`)
    acquireLockStep({ key: lotLock, timeout: 10, ttl: 30 })

    validateSellerOpenStep({ seller_id: input.seller_id })

    const reportable = getReportableLotStep(
      transform({ input }, ({ input }) => ({
        seller_id: input.seller_id,
        lot_id: input.lot_id,
      }))
    )

    const report = createLotReportStep(
      transform({ input, reportable }, ({ input, reportable }) => ({
        lot_id: input.lot_id,
        seller_id: input.seller_id,
        winner_customer_id: reportable.winner_customer_id,
      }))
    )

    releaseLockStep({ key: lotLock })

    return new WorkflowResponse(
      transform({ reportable, report }, ({ reportable, report }) => ({
        id: report.id,
        lot_id: report.lot_id,
        status: report.status,
        reported_at: new Date(report.created_at).toISOString(),
        pay_by: new Date(
          new Date(reportable.closed_at).getTime() + PAY_WINDOW_MS
        ).toISOString(),
      }) satisfies ReportUnpaidLotResult)
    )
  }
)
