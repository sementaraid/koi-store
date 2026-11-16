import type { MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { closeAuctionWorkflow } from "../workflows/close-auction"
import { closeLotWorkflow } from "../workflows/close-lot"

const PAGE = 50

type Query = Omit<RemoteQueryFunction, symbol>

// Ids are read page by page first, then processed: closing removes a row from
// the filter, which would shift offset paging.
async function collectIds(
  query: Query,
  entity: "lot" | "auction",
  filters: Record<string, unknown>
): Promise<string[]> {
  const ids: string[] = []
  for (let skip = 0; ; skip += PAGE) {
    const { data } = await query.graph({
      entity,
      fields: ["id"],
      filters,
      pagination: { skip, take: PAGE, order: { id: "ASC" } },
    })
    ids.push(...data.map((row: { id: string }) => row.id))
    if (data.length < PAGE) {
      return ids
    }
  }
}

// US-050 T-050.2 (AC1): every minute, close each `open` lot whose end_time
// (extended by US-043) has passed, then close each `live` auction with no open
// lot left. Both workflows re-check under their lock, so a re-run or an
// overlapping tick changes nothing. One failure is logged and the rest run.
// No money moves at close (escrow parked, owner 2026-11-16).
export default async function closeLots(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const lotIds = await collectIds(query, "lot", {
    status: "open",
    end_time: { $lte: new Date() },
  })
  let won = 0
  let unsold = 0
  let skipped = 0
  let failed = 0
  for (const id of lotIds) {
    try {
      const { result } = await closeLotWorkflow(container).run({
        input: { lot_id: id },
      })
      if (result.status === "won") won++
      else if (result.status === "unsold") unsold++
      else skipped++
    } catch (e) {
      failed++
      logger.error(`close-lots: lot ${id} failed: ${e}`)
    }
  }

  const auctionIds = await collectIds(query, "auction", { status: "live" })
  let closed = 0
  for (const id of auctionIds) {
    try {
      const { result } = await closeAuctionWorkflow(container).run({
        input: { auction_id: id },
      })
      if (result.closed) closed++
    } catch (e) {
      failed++
      logger.error(`close-lots: auction ${id} failed: ${e}`)
    }
  }

  logger.info(
    `close-lots: lots found ${lotIds.length}, won ${won}, unsold ${unsold}, skipped ${skipped}, failed ${failed}; auctions closed ${closed}`
  )
}

export const config = {
  name: "close-lots",
  schedule: "* * * * *",
}
