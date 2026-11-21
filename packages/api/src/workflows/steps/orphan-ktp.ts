import fs from "fs/promises"
import path from "path"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type Query = Omit<RemoteQueryFunction, symbol>

// US-093 (AC1, AC2): an orphan KTP file is deleted only once it is older than
// this. The owner sets it through ORPHAN_KTP_RETENTION_DAYS; the default keeps
// cleanup running when the var is missing or invalid. 30 days leaves a
// registration that sits unsubmitted for a while its photo.
export const ORPHAN_KTP_RETENTION_DAYS = 30

export const orphanKtpRetentionMs = () => {
  const days = Number(process.env.ORPHAN_KTP_RETENTION_DAYS)
  const valid = Number.isFinite(days) && days >= 1 ? days : ORPHAN_KTP_RETENTION_DAYS
  return valid * 24 * 60 * 60 * 1000
}

export const ORPHAN_KTP_BATCH_SIZE = 100

// The local provider's private dir (medusa-config.ts). Enumerating files is
// not something the File Module does: `listFiles` only accepts ids and reads
// them back from the provider (verified in @medusajs/file's
// file-module-service.js), so the directory is the only source. Only the local
// provider keeps private files here.
// ponytail: local-provider only. With an S3 provider, replace this with a
// bucket lifecycle rule on the `ktp` prefix.
const PRIVATE_DIR = path.join(process.cwd(), "private-uploads")

// The upload route names a KTP `ktp.<ext>`; the provider prefixes the key with
// `private-` and a timestamp. Anything else in the dir (claim videos, top-up
// screenshots) must not match, and public farm photos live in `static/` under
// keys with no `private-` prefix, so they are never listed.
const KTP_KEY = /^private-\d+-ktp\.(jpg|jpeg|png|webp)$/

const SELLER_PAGE = 500

// Every seller's referenced KTP key, in one paged read per 500 sellers — never
// one query per file.
const referencedKeys = async (query: Query): Promise<Set<string>> => {
  const keys = new Set<string>()
  for (let skip = 0; ; skip += SELLER_PAGE) {
    const { data } = await query.graph({
      entity: "seller",
      fields: ["id", "custom_fields.ktp_photo_key"],
      pagination: { skip, take: SELLER_PAGE, order: { id: "ASC" } },
    })
    for (const row of data as {
      custom_fields?: { ktp_photo_key?: string | null } | null
    }[]) {
      const key = row.custom_fields?.ktp_photo_key
      if (key) keys.add(key)
    }
    if (data.length < SELLER_PAGE) return keys
  }
}

export type OrphanKtpInput = { retention_ms: number; batch_size: number }

// US-093 (AC1, AC3): the oldest KTP keys with no seller reference, at most
// `batch_size` of them. Read only. The reference read runs after the age
// filter, so a photo attached to a seller is dropped even if it is old.
export const listOrphanKtpFilesStep = createStep(
  "list-orphan-ktp-files",
  async (input: OrphanKtpInput, { container }) => {
    let names: string[]
    try {
      names = await fs.readdir(PRIVATE_DIR)
    } catch {
      // No upload dir yet: nothing to clean.
      return new StepResponse([] as string[])
    }

    const cutoff = Date.now() - input.retention_ms
    const old: string[] = []
    for (const name of names) {
      if (!KTP_KEY.test(name)) continue
      const stat = await fs.stat(path.join(PRIVATE_DIR, name)).catch(() => null)
      if (!stat?.isFile() || stat.mtimeMs >= cutoff) continue
      old.push(name)
    }
    if (!old.length) return new StepResponse([] as string[])

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const referenced = await referencedKeys(query)
    return new StepResponse(
      old.filter((key) => !referenced.has(key)).slice(0, input.batch_size)
    )
  }
)

// US-093 (AC2): delete one batch through the File Module (the provider owns
// the path). No compensation: file bytes cannot be restored, same as the
// claim video delete. Deleting a file the provider already lost is a no-op.
export const deleteOrphanKtpFilesStep = createStep(
  "delete-orphan-ktp-files",
  async (keys: string[], { container }) => {
    // Guard again at the boundary: only a private KTP key ever reaches the
    // provider, never a public farm photo.
    const safe = keys.filter((key) => KTP_KEY.test(key))
    if (safe.length) {
      await container.resolve(Modules.FILE).deleteFiles(safe)
    }
    return new StepResponse(safe)
  }
)
