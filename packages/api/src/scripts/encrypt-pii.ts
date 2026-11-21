import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  decryptPii,
  encryptPii,
  isPiiEncrypted,
} from "../utils/pii-crypto"

/*
 * US-092 T-092.6 (D-043): one-off in-place encryption of the plaintext PII rows
 * written before T-092.1's write path existed.
 *
 * D-043 names the wallet and top-up tables, but neither holds PII: `wallet`
 * has only an id, `wallet_transaction` holds type/amount/reference/created_by
 * and `topup_request` holds a private file key, `reason` and `reviewed_by`.
 * None of those is a NIK, a bank account or a phone, so there is nothing to
 * encrypt there. The fields that do carry plaintext are the ones below, taken
 * from the PII_FIELDS list the write path and the response decryptor share.
 *
 * Read, encrypt in place, update by id (no temp table, no plaintext in logs),
 * then re-read and fail if any plaintext is left. Idempotent: already-envelope
 * values are skipped by the filter and by `encryptPii`, so a second run changes
 * 0 rows.
 *
 *   bun run encrypt:pii dry-run   # counts only, writes nothing
 *   bun run encrypt:pii           # encrypt in place
 *
 * `--dry-run` as a flag is rejected by the Medusa CLI ("Unknown arguments"), so
 * the rehearsal uses the positional `dry-run` the CLI passes through.
 */

export const PII_TARGETS = [
  { table: "seller", columns: ["phone"] },
  {
    table: "payment_details",
    columns: ["holder_name", "account_number", "iban", "routing_number"],
  },
  { table: "seller_custom_fields", columns: ["ktp_nik"] },
  { table: "customer", columns: ["phone"] },
  { table: "customer_address", columns: ["phone"] },
  // D-062: Medusa's address snapshots, written before T-092.10's write path.
  { table: "cart_address", columns: ["phone"] },
  { table: "order_address", columns: ["phone"] },
  { table: "fulfillment_address", columns: ["phone"] },
  { table: "stock_location_address", columns: ["phone"] },
] as const

type Target = (typeof PII_TARGETS)[number]
type Row = Record<string, unknown>
type PgResult = { rows: Record<string, unknown>[] }

const BATCH = 500
const ENVELOPE_LIKE = "enc:v1:%"

// Row-level transform, pure and exported for the unit spec. Returns only the
// columns that change: plaintext becomes ciphertext, an existing envelope and a
// blank value are left alone (blank stays blank, not null).
export const encryptColumns = (
  row: Row,
  columns: readonly string[]
): Record<string, string> => {
  const patch: Record<string, string> = {}
  for (const column of columns) {
    const value = row[column]
    if (typeof value !== "string") continue
    const next = encryptPii(value)
    if (next === null || next === value) continue
    patch[column] = next
  }
  return patch
}

const plaintextCondition = (column: string) =>
  `("${column}" IS NOT NULL AND btrim("${column}") <> '' AND "${column}" NOT LIKE '${ENVELOPE_LIKE}')`

const plaintextCounts = async (
  pg: { raw: (sql: string, bindings?: unknown[]) => Promise<unknown> },
  target: Target
): Promise<Record<string, number>> => {
  const { rows } = (await pg.raw(
    `SELECT ${target.columns
      .map((c, i) => `count(*) FILTER (WHERE ${plaintextCondition(c)})::int AS "c${i}"`)
      .join(", ")} FROM "${target.table}"`
  )) as PgResult
  return Object.fromEntries(
    target.columns.map((c, i) => [c, Number(rows[0][`c${i}`])])
  )
}

export default async function encryptExistingPii({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // Fail before any read or write: a missing or malformed key throws here.
  const probe = "pii-key-self-check"
  if (!isPiiEncrypted(encryptPii(probe)) || decryptPii(probe) !== probe) {
    throw new Error("PII_ENCRYPTION_KEY self-check failed; nothing was written.")
  }

  const dryRun = [...(args ?? []), ...process.argv].some(
    (a) => a === "--dry-run" || a === "dry-run"
  )

  if (dryRun) {
    let total = 0
    for (const target of PII_TARGETS) {
      const counts = await plaintextCounts(pg, target)
      for (const [column, count] of Object.entries(counts)) {
        logger.info(`${target.table}.${column}: ${count} plaintext row(s)`)
        total += count
      }
    }
    logger.info(`Dry run: ${total} plaintext value(s) in scope; nothing written.`)
    return
  }

  const changed: Record<string, number> = {}
  let total = 0
  let processed = 0

  for (const target of PII_TARGETS) {
    let lastId: string | null = null
    for (;;) {
      const query = `SELECT "id", ${target.columns
        .map((c) => `"${c}"`)
        .join(", ")} FROM "${target.table}"
        WHERE ${target.columns.map(plaintextCondition).join(" OR ")}
        ${lastId ? 'AND "id" > ?' : ""}
        ORDER BY "id" LIMIT ${BATCH}`
      const { rows } = (await pg.raw(
        query,
        lastId ? [lastId] : []
      )) as PgResult
      if (!rows.length) break

      for (const row of rows) {
        const patch = encryptColumns(row, target.columns)
        const keys = Object.keys(patch)
        if (!keys.length) continue
        await pg.raw(
          `UPDATE "${target.table}" SET ${keys
            .map((k) => `"${k}" = ?`)
            .join(", ")} WHERE "id" = ?`,
          [...keys.map((k) => patch[k]), row.id as string]
        )
        for (const key of keys) {
          const field = `${target.table}.${key}`
          changed[field] = (changed[field] ?? 0) + 1
          total += 1
        }
      }

      processed += rows.length
      lastId = rows[rows.length - 1].id as string
    }
  }

  // Verify: re-read every in-scope field; any plaintext left is a failure.
  let remaining = 0
  for (const target of PII_TARGETS) {
    const counts = await plaintextCounts(pg, target)
    for (const [column, count] of Object.entries(counts)) {
      if (count > 0) {
        remaining += count
        logger.error(`${target.table}.${column}: ${count} plaintext row(s) still present`)
      }
    }
  }
  if (remaining > 0) {
    throw new Error(`PII encryption incomplete: ${remaining} plaintext value(s) remain.`)
  }

  for (const [field, count] of Object.entries(changed)) {
    logger.info(`${field}: ${count} row(s) encrypted`)
  }
  logger.info(
    `Encrypted ${total} value(s) across ${processed} row(s); re-read confirms 0 plaintext values remain.`
  )
}
