import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AUCTION_MODULE } from "../modules/auction"
import type AuctionModuleService from "../modules/auction/service"
import { confirmLotPaymentWorkflow } from "../workflows/confirm-lot-payment"

/*
 * One-off demo data (owner-approved 2026-11-26) on the shared dev/prod DB.
 *
 * US-105 (D-081): fills the koi's own fields on three lots of the live Sakura
 * auction, so /lelang shows a real variety/size/age/certificate set next to a
 * lot with none (Hi Utsuri, left untouched). US-108/US-110: confirms the
 * winner's payment on the Showa lot once, which creates its one `pending`
 * payout.
 *
 * Direct module writes for the koi fields, like seed-lots.ts: descriptive demo
 * data on an existing lot, no fee, no ledger, no guard to run. The payment
 * confirm goes through its workflow as always.
 *
 * Idempotent: a field already at its target value is not written, and a lot
 * that is no longer `won` (or already has a payout) is not confirmed again.
 */

type KoiField =
  | "variety"
  | "size_cm"
  | "age"
  | "sex"
  | "has_certificate"
  | "certificate_issuer"
  | "pond_origin"
  | "breeder_notes"
  | "video_url"

type LotPlan = { title: string; fields: Partial<Record<KoiField, string | number | boolean | null>> }

const FIELDS: KoiField[] = [
  "variety",
  "size_cm",
  "age",
  "sex",
  "has_certificate",
  "certificate_issuer",
  "pond_origin",
  "breeder_notes",
  "video_url",
]

// D-081 strings exactly.
const LOTS: LotPlan[] = [
  {
    title: "Sanke Yonsai · 55 cm",
    fields: {
      variety: "Sanke",
      size_cm: 55,
      age: "Nisai (2 tahun)",
      sex: "Betina",
      has_certificate: true,
      certificate_issuer: "ZNA",
      pond_origin: "Blitar, Jawa Timur",
      breeder_notes:
        "Shiroji bersih, beni tebal dan rata dari kepala sampai ekor.",
      video_url: "https://youtu.be/aqz-KE-bpKQ",
    },
  },
  {
    title: "Kohaku Sansai · 48 cm",
    fields: {
      variety: "Kohaku",
      size_cm: 48,
      age: "Sansai (3 tahun)",
      sex: "Betina",
      has_certificate: false,
      certificate_issuer: null,
      pond_origin: "Blitar, Jawa Timur",
      video_url: "https://youtube.com/shorts/aqz-KE-bpKQ",
    },
  },
  {
    title: "Showa Nisai · 40 cm",
    fields: {
      variety: "Showa",
      size_cm: 40,
      age: "Nisai (2 tahun)",
      sex: "Jantan",
      has_certificate: true,
      certificate_issuer: "APKI",
      pond_origin: "Blitar, Jawa Timur",
      video_url: null,
    },
  },
  // Left untouched on purpose: the "no koi data yet" example.
  { title: "Hi Utsuri Gosai · 62 cm", fields: {} },
]

const SHOWA_LOT_ID = "lot_01M7YRQP9KPVE0Q7B4QG02BSD5"

type LotRow = { id: string; status: string; product?: { title?: string } | null } & Record<
  KoiField,
  string | number | boolean | null
>

type PayoutRow = { id: string; lot_id: string; status: string; gross_amount: number }

const show = (value: unknown) =>
  value === null || value === undefined ? "null" : String(value)

export default async function demoKoiFields({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const auctionService = container.resolve<AuctionModuleService>(AUCTION_MODULE)

  const readLots = async (): Promise<LotRow[]> => {
    const { data } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "product.title", ...FIELDS],
      pagination: { take: 200 },
    })
    return data as unknown as LotRow[]
  }

  const readPayouts = async (): Promise<PayoutRow[]> => {
    const { data } = await query.graph({
      entity: "lot_payout",
      fields: ["id", "lot_id", "status", "gross_amount"],
      pagination: { take: 200 },
    })
    return data as unknown as PayoutRow[]
  }

  const before = await readLots()
  const payoutsBefore = await readPayouts()

  // --- 1. Koi fields --------------------------------------------------------
  let changed = 0
  for (const plan of LOTS) {
    const matches = before.filter((lot) => lot.product?.title === plan.title)
    if (matches.length !== 1) {
      throw new Error(
        `Expected one lot titled "${plan.title}", found ${matches.length}.`
      )
    }
    const lot = matches[0]
    const update: Record<string, string | number | boolean | null> = {}
    for (const [key, value] of Object.entries(plan.fields)) {
      if (lot[key as KoiField] !== value) {
        update[key] = value
      }
    }

    console.log(`\n${plan.title} (${lot.id})`)
    for (const field of FIELDS) {
      if (plan.fields[field] === undefined && lot[field] === null) {
        continue
      }
      const next = Object.prototype.hasOwnProperty.call(update, field)
        ? update[field]
        : lot[field]
      console.log(`  ${field.padEnd(19)} ${show(lot[field]).padEnd(30)} -> ${show(next)}`)
    }

    if (Object.keys(update).length) {
      await auctionService.updateLots([{ id: lot.id, ...update }])
      changed += 1
      console.log(`  written: ${Object.keys(update).join(", ")}`)
    } else {
      console.log("  no change")
    }
  }

  // --- 2. Confirm the winner's payment once --------------------------------
  const showaLot = before.find((lot) => lot.id === SHOWA_LOT_ID)
  if (!showaLot) {
    throw new Error(`Lot ${SHOWA_LOT_ID} not found.`)
  }
  const existingPayout = payoutsBefore.find((p) => p.lot_id === SHOWA_LOT_ID)
  if (existingPayout) {
    console.log(
      `\nPayout already exists for ${SHOWA_LOT_ID}: ${existingPayout.id} (${existingPayout.status}) — skipped.`
    )
  } else if (showaLot.status !== "won") {
    console.log(
      `\nLot ${SHOWA_LOT_ID} is "${showaLot.status}", not "won" — payment confirm skipped.`
    )
  } else {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@koi.dev"
    const { data: admins } = await query.graph({
      entity: "user",
      fields: ["id", "email"],
      filters: { email: adminEmail },
    })
    const admin = (admins as { id: string }[])[0]
    if (!admin) {
      throw new Error(`Seeded admin ${adminEmail} not found.`)
    }
    const { result } = await confirmLotPaymentWorkflow(container).run({
      input: { admin_id: admin.id, lot_id: SHOWA_LOT_ID },
    })
    const payouts = await readPayouts()
    const payout = payouts.find((p) => p.lot_id === SHOWA_LOT_ID)
    if (!payout || payout.status !== "pending") {
      throw new Error("Payment confirm did not leave a pending payout.")
    }
    console.log(
      `\nConfirmed payment for ${SHOWA_LOT_ID} as ${admin.id} (${adminEmail}).`
    )
    console.log(
      `Payout ${payout.id}: gross ${payout.gross_amount}, status ${payout.status}, lot status ${result.update.status}.`
    )
  }

  // --- 3. Read-only verification -------------------------------------------
  const after = await readLots()
  const payoutsAfter = await readPayouts()
  const failures: string[] = []

  for (const plan of LOTS) {
    const lot = after.find((l) => l.product?.title === plan.title)
    if (!lot) {
      failures.push(`${plan.title}: missing`)
      continue
    }
    for (const [key, value] of Object.entries(plan.fields)) {
      if (lot[key as KoiField] !== value) {
        failures.push(
          `${plan.title}.${key} is ${show(lot[key as KoiField])}, want ${show(value)}`
        )
      }
    }
    if (plan.title === "Hi Utsuri Gosai · 62 cm") {
      for (const field of FIELDS) {
        if (lot[field] !== null) {
          failures.push(`${plan.title}.${field} is ${show(lot[field])}, want null`)
        }
      }
    }
  }

  const pending = payoutsAfter.filter((p) => p.status === "pending")
  if (pending.length !== 1 || pending[0].lot_id !== SHOWA_LOT_ID) {
    failures.push(
      `pending payouts: ${pending.map((p) => `${p.id}@${p.lot_id}`).join(", ") || "none"}`
    )
  }

  logger.info(
    `\nLots changed this run: ${changed}. Payouts: ${payoutsAfter.length} (pending ${pending.length}).`
  )
  if (failures.length) {
    throw new Error(`Verification failed:\n- ${failures.join("\n- ")}`)
  }
  logger.info("Verification passed: three lots carry their fields, Hi Utsuri null, one pending payout.")
}
