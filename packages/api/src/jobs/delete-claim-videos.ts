import type { MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteClaimVideoWorkflow } from "../workflows/delete-claim-video"
import { CLAIM_VIDEO_RETENTION_MS } from "../workflows/steps/claim"

const PAGE = 50

type Query = Omit<RemoteQueryFunction, symbol>

// Ids are read page by page first, then processed: setting
// `video_deleted_at` removes a row from the filter, which would shift offset
// paging.
async function collectIds(
  query: Query,
  filters: Record<string, unknown>
): Promise<string[]> {
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
      return ids
    }
  }
}

// US-061 T-061.1 (AC1, D-018, D-027, D-038, D-058): every day at 03:00,
// delete the private video of each claim closed (`confirmed` by
// `confirmed_at`, `rejected` by `decided_at`) more than 30 days ago. The row
// stays; the workflow re-checks under the `claim:<id>` lock, so a re-run
// changes nothing. One failure is logged and the rest run. No money moves and
// no ledger row is written.
export default async function deleteClaimVideos(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const cutoff = new Date(Date.now() - CLAIM_VIDEO_RETENTION_MS)
  const ids = await collectIds(query, {
    status: { $in: ["confirmed", "rejected"] },
    video_deleted_at: null,
    $or: [{ confirmed_at: { $lt: cutoff } }, { decided_at: { $lt: cutoff } }],
  })

  let deleted = 0
  let skipped = 0
  let failed = 0
  for (const id of ids) {
    try {
      const { result } = await deleteClaimVideoWorkflow(container).run({
        input: { claim_id: id },
      })
      if (result.deleted) deleted++
      else skipped++
    } catch (e) {
      failed++
      logger.error(`delete-claim-videos: claim ${id} failed: ${e}`)
    }
  }

  logger.info(
    `delete-claim-videos: found ${ids.length}, deleted ${deleted}, skipped ${skipped}, failed ${failed}`
  )
}

export const config = {
  name: "delete-claim-videos",
  schedule: "0 3 * * *",
}
