import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  deleteOrphanKtpWorkflow,
  DeleteOrphanKtpResult,
} from "../workflows/delete-orphan-ktp"
import { ORPHAN_KTP_BATCH_SIZE } from "../workflows/steps/orphan-ktp"

// US-093 T-093.1 (AC1–AC3, D-017): once a day, delete the private KTP uploads
// that never reached a seller and are older than the retention window. Each
// pass is one workflow run over at most 100 files; the loop stops as soon as a
// pass deletes nothing, so a re-run writes nothing and a large backlog is
// worked off in batches. A failed pass is logged and stops the run; the next
// scheduled run picks up where it left off. The cap only bounds a stuck runner:
// 100 passes × 100 files per day is far above the real backlog.
const MAX_PASSES = 100

export default async function deleteOrphanKtp(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  let deleted = 0
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const { result } = (await deleteOrphanKtpWorkflow(container).run()) as {
      result: DeleteOrphanKtpResult
    }
    deleted += result.deleted
    if (result.deleted === 0) break
  }

  logger.info(
    `delete-orphan-ktp: deleted ${deleted} in batches of ${ORPHAN_KTP_BATCH_SIZE}`
  )
}

export const config = {
  name: "delete-orphan-ktp",
  schedule: "0 4 * * *",
}
