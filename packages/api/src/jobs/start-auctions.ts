import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { startAuctionWorkflow } from "../workflows/start-auction"

const PAGE = 50

// US-033 T-033.1 (AC2): every minute, start each `scheduled` auction whose
// start_at has passed. The workflow re-checks under the per-auction lock, so a
// re-run or an overlapping tick changes nothing. One failure is logged and the
// rest still run.
export default async function startAuctions(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  // Ids are read page by page first, then processed: starting an auction
  // removes it from the filter, which would shift offset paging.
  const ids: string[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({
      entity: "auction",
      fields: ["id"],
      filters: { status: "scheduled", start_at: { $lte: now } },
      pagination: { skip, take: PAGE, order: { id: "ASC" } },
    })
    ids.push(...data.map((a) => a.id))
    if (data.length < PAGE) {
      break
    }
  }

  let started = 0
  let skipped = 0
  let failed = 0
  for (const id of ids) {
    try {
      const { result } = await startAuctionWorkflow(container).run({
        input: { auction_id: id },
      })
      result.started ? started++ : skipped++
    } catch (e) {
      failed++
      logger.error(`start-auctions: auction ${id} failed: ${e}`)
    }
  }

  logger.info(
    `start-auctions: found ${ids.length}, started ${started}, skipped ${skipped}, failed ${failed}`
  )
}

export const config = {
  name: "start-auctions",
  schedule: "* * * * *",
}
