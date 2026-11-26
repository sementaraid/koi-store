import { writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { deflateSync } from "zlib"

import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import { toWonLotPaymentProof } from "../api/store/won-lots/route"
import { submitLotPaymentProofWorkflow } from "../workflows/submit-lot-payment-proof"

/*
 * Owner-approved demo data (2026-11-26). Puts ONE real, private transfer proof
 * on Agus's already-won demo lot so the admin "Pembayaran pemenang" queue and
 * the winner's proof states can be tried in the UI.
 *
 * Upload goes through `submitLotPaymentProofWorkflow`, the same path the store
 * route uses: `uploadFilesStep` with `access: "private"`, then the lot fields.
 * The lot status stays `won`; nothing is rejected or confirmed here.
 *
 * Idempotent: a lot that already carries a proof is left untouched.
 *
 * Run: bun x medusa exec ./src/scripts/demo-lot-payment-proof.ts
 */

const LOT_ID = "lot_01M7YRQP9JQG8D528874DNTXC5"
const WINNER_EMAIL = "agus@koi.dev"
const DEMO_FILE = "bukti-transfer-demo.png"

type LotRow = {
  id: string
  status: string
  winner_customer_id: string | null
  payment_proof_file_key: string | null
  payment_proof_status: string | null
  payment_proof_reason: string | null
  payment_proof_uploaded_at: string | null
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// CRC32 (PNG chunks), table built once. No dependency needed for one image.
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

const crc32 = (buf: Buffer): number => {
  let c = 0xffffffff
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type: string, data: Buffer): Buffer => {
  const typeBuf = Buffer.from(type, "ascii")
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([length, typeBuf, data, crc])
}

// A real 480x270 RGB PNG: paper background, blue header band, red disc, dark
// footer bar. Viewable in any browser; the admin route streams these bytes.
const createProofPng = (width = 480, height = 270): Buffer => {
  const stride = width * 3 + 1
  const raw = Buffer.alloc(height * stride)

  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const offset = y * stride + 1 + x * 3
      let r = 0xf5
      let g = 0xf0
      let b = 0xe6
      if (y < 64) {
        r = 0x1d
        g = 0x3a
        b = 0x5f
      }
      const dx = x - width / 2
      const dy = y - height / 2
      if (dx * dx + dy * dy <= 70 * 70) {
        r = 0xd9
        g = 0x3b
        b = 0x30
      }
      if (y >= 220 && y < 236 && x > 60 && x < width - 60) {
        r = 0x22
        g = 0x22
        b = 0x22
      }
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour RGB

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const readLot = async (
  container: ExecArgs["container"]
): Promise<LotRow | undefined> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "lot",
    fields: [
      "id",
      "status",
      "winner_customer_id",
      "payment_proof_file_key",
      "payment_proof_status",
      "payment_proof_reason",
      "payment_proof_uploaded_at",
    ],
    filters: { id: LOT_ID },
  })
  return row as unknown as LotRow | undefined
}

const summary = (row: LotRow, fileKeyLength: number) =>
  `status=${row.payment_proof_status} ` +
  `file_key_length=${fileKeyLength} ` +
  `uploaded_at=${row.payment_proof_uploaded_at ?? "null"}`

export default async function demoLotPaymentProof({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const lot = await readLot(container)
  if (!lot) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Lot ${LOT_ID} was not found`
    )
  }

  logger.info(
    `Lot ${LOT_ID}: status=${lot.status} ` +
      `proof_status=${lot.payment_proof_status ?? "none"} ` +
      `has_file_key=${!!lot.payment_proof_file_key}`
  )

  // Guard before any write: only a `won` lot accepts a proof, and only when it
  // has none. Anything else is reported and left untouched.
  if (lot.status !== "won") {
    logger.warn(
      `Lot is '${lot.status}', not 'won'. Nothing written. Stopping.`
    )
    return
  }

  if (lot.payment_proof_file_key || (lot.payment_proof_status ?? "none") !== "none") {
    logger.info(
      `Lot already carries a proof; leaving it untouched. ` +
        summary(lot, lot.payment_proof_file_key?.length ?? 0)
    )
    return
  }

  if (!lot.winner_customer_id) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      `Lot ${LOT_ID} has no winner; cannot submit a payment proof`
    )
  }

  const {
    data: [winner],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { id: lot.winner_customer_id },
  })
  const email = (winner as { email?: string } | undefined)?.email
  if (email !== WINNER_EMAIL) {
    throw new MedusaError(
      MedusaError.Types.CONFLICT,
      `Lot winner is '${email ?? "unknown"}', expected ${WINNER_EMAIL}; ` +
        `nothing written`
    )
  }
  logger.info(`Winner confirmed as ${email}.`)

  const png = createProofPng()
  const tempPath = join(tmpdir(), "koi-demo-payment-proof.png")
  writeFileSync(tempPath, png)
  logger.info(
    `Generated ${png.length} byte PNG (${png.subarray(1, 4).toString("ascii")}); ` +
      `temp copy at ${tempPath}`
  )

  const { result } = await submitLotPaymentProofWorkflow(container).run({
    input: {
      customer_id: lot.winner_customer_id,
      lot_id: LOT_ID,
      proof: {
        filename: DEMO_FILE,
        mimeType: "image/png",
        content: png.toString("base64"),
      },
    },
  })

  const updated = result as unknown as LotRow
  logger.info(
    `Uploaded through submit-lot-payment-proof. ` +
      summary(updated, updated.payment_proof_file_key?.length ?? 0)
  )

  // Read-only verification: the same fields and converter the admin queue
  // route uses, plus the private bytes through the File Module.
  const after = await readLot(container)
  if (!after) {
    throw new Error(`Lot ${LOT_ID} disappeared after the upload`)
  }
  const proof = toWonLotPaymentProof(after as unknown as Record<string, unknown>)

  if (after.status !== "won") {
    throw new Error(`Lot status changed to '${after.status}'; expected 'won'`)
  }
  if (proof.status !== "pending" || !proof.has_image) {
    throw new Error(
      `Admin queue proof mismatch: status=${proof.status} has_image=${proof.has_image}`
    )
  }

  const fileKey = after.payment_proof_file_key
  if (!fileKey) {
    throw new Error("Lot has no payment_proof_file_key after the upload")
  }
  const bytes = await container.resolve(Modules.FILE).getAsBuffer(fileKey)
  if (bytes.length === 0 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`Stored private file is not a readable PNG (${bytes.length} bytes)`)
  }

  logger.info(
    `Verified: lot_status=won admin_proof_status=${proof.status} ` +
      `has_image=${proof.has_image} uploaded_at=${proof.uploaded_at} ` +
      `private_bytes=${bytes.length}`
  )
  logger.info("No payment was confirmed and the proof was not rejected.")
}
