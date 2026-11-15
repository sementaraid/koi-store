import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// The settings table holds exactly one row (D-010). The workflow's lock
// serialises writers; this index is the database backstop against a second row
// (e.g. two processes racing).
export default async function platformSettingSingleton({ container }: ExecArgs) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await pg.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_platform_setting_singleton"
       ON "platform_setting" ("singleton")
       WHERE "deleted_at" IS NULL AND "singleton" = true`
  )
}
