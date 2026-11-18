import type { MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { confirmClaimWorkflow } from "../workflows/confirm-claim"
import { CLAIM_CONFIRM_WINDOW_MS } from "../workflows/steps/claim"

const PAGE = 50

type Query = Omit<RemoteQueryFunction, symbol>

// US-056 T-056.1b (AC4, D-027, D-058): every hour, confirm each `resolved`
// claim whose 3-day winner window (CLAIM_CONFIRM_WINDOW_MS) has passed. Ids
// are read page by page first, then each is confirmed by `{ id }`: confirming
// removes a row from the filter, which would shift offset paging. The workflow
// re-checks `status === "resolved"` under the `claim:<id>` lock, so a re-run or
// an overlapping tick changes nothing. One failure is logged and the rest run.
// Hourly, not close-lots' per-minute tick: a 3-day deadline needs no finer
// resolution, and claims are a different domain with their own log line.
// No money moves and no ledger row is written (D-058).
export default async function confirmClaims(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const filters = {
    status: "resolved" as const,
    resolved_at: { $lte: new Date(Date.now() - CLAIM_CONFIRM_WINDOW_MS) },
  }
  const ids: string[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({
      entity: "claim",
      fields: ["id"],
      filters,
      pagination: { skip, take: PAGE, order: { id: "ASC" } },
    })
    ids.push(...data.map((row: { id: string }) => row.id))
    if (data.length < PAGE) {
      break
    }
  }

  let confirmed = 0
  let failed = 0
  for (const id of ids) {
    try {
      const { result } = await confirmClaimWorkflow(container).run({
        input: { claim_id: id },
      })
      if (result.status === "confirmed") confirmed++
    } catch (e) {
      failed++
      logger.error(`confirm-claims: claim ${id} failed: ${e}`)
    }
  }

  logger.info(
    `confirm-claims: found ${ids.length}, confirmed ${confirmed}, failed ${failed}`
  )
}

export const config = {
  name: "confirm-claims",
  schedule: "0 * * * *",
}
