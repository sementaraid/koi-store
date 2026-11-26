import type { MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { markPayoutDueWorkflow } from "../workflows/mark-payout-due"

const PAGE = 50

type Query = Omit<RemoteQueryFunction, symbol>

// US-110 T-110.2 (AC3, AC6, D-074, D-075): hourly, move each `pending` payout
// to `due` when its 3-day-after-shipped deadline has passed with no open claim
// (or when an approved replacement is settled), and cancel it on an approved
// refund claim. Ids are read page by page first, then each is processed by
// `{ id }`: the workflow re-reads under the `payout:<id>` lock, so a re-run or
// an overlapping tick changes nothing. One failure is logged and the rest run.
// Batched (50 per page) so the job does not load every payout at once.
export default async function markPayoutsDue(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const ids: string[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({
      entity: "lot_payout",
      fields: ["id"],
      filters: { status: "pending" },
      pagination: { skip, take: PAGE, order: { id: "ASC" } },
    })
    ids.push(...data.map((row: { id: string }) => row.id))
    if (data.length < PAGE) {
      break
    }
  }

  let due = 0
  let cancelled = 0
  let held = 0
  let failed = 0
  for (const id of ids) {
    try {
      const { result } = await markPayoutDueWorkflow(container).run({
        input: { payout_id: id },
      })
      if (result.action === "due") due++
      else if (result.action === "cancel") cancelled++
      else held++
    } catch (e) {
      failed++
      logger.error(`mark-payouts-due: payout ${id} failed: ${e}`)
    }
  }

  logger.info(
    `mark-payouts-due: found ${ids.length}, due ${due}, cancelled ${cancelled}, held ${held}, failed ${failed}`
  )
}

export const config = {
  name: "mark-payouts-due",
  schedule: "0 * * * *",
}
