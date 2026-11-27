import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import {
  createCustomerAccountWorkflow,
  updateCustomersWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createProductsWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"

import { AUCTION_MODULE } from "../modules/auction"
import type AuctionModuleService from "../modules/auction/service"
import { MODERATION_MODULE } from "../modules/moderation"
import type ModerationModuleService from "../modules/moderation/service"
import { encryptPii } from "../utils/pii-crypto"
import { createProofPng } from "./demo-lot-payment-proof"
import { createWalletAdjustmentWorkflow } from "../workflows/create-wallet-adjustment"
import { createCustomerWalletWorkflow } from "../workflows/create-customer-wallet"
import { createTopupRequestWorkflow } from "../workflows/create-topup-request"
import { decideTopupRequestWorkflow } from "../workflows/decide-topup-request"
import { giveStrikeWorkflow } from "../workflows/give-strike"
import { createAuctionWorkflow } from "../workflows/create-auction"
import { submitAuctionWorkflow } from "../workflows/submit-auction"
import { closeLotWorkflow } from "../workflows/close-lot"
import { submitLotPaymentProofWorkflow } from "../workflows/submit-lot-payment-proof"
import { rejectLotPaymentProofWorkflow } from "../workflows/reject-lot-payment-proof"
import { confirmLotPaymentWorkflow } from "../workflows/confirm-lot-payment"
import { markLotShippedWorkflow } from "../workflows/mark-lot-sold-status"
import { markLotDeliveredWorkflow } from "../workflows/mark-lot-delivered"
import { submitArrivalProofWorkflow } from "../workflows/submit-arrival-proof"
import { markPayoutDueWorkflow } from "../workflows/mark-payout-due"
import { payLotPayoutWorkflow } from "../workflows/pay-lot-payout"
import { openClaimWorkflow } from "../workflows/open-claim"
import { disputeClaimWorkflow } from "../workflows/dispute-claim"
import { approveClaimWorkflow } from "../workflows/approve-claim"
import { rejectClaimWorkflow } from "../workflows/reject-claim"
import { updatePlatformSettingsWorkflow } from "../workflows/update-platform-settings"

/*
 * Owner request (2026-11-27): after the database reset, every ready admin-koi
 * page must show data. `seed-koi.ts` seeds the catalog, sellers and customers;
 * `seed-lots.ts` seeds the live auction. This script adds the rows the admin
 * queues read: pending/decided farms, top-ups, the auction approval queue,
 * winner payments, DOA claims, the report archive, the three payout states and
 * customer wallets, bids and strikes.
 *
 * Every status is reached through the real workflow that owns it. The only
 * direct writes are the ones no workflow owns: the historical `lot_report`
 * archive rows (D-079 retired report creation) and backdating a saved
 * timestamp so a payout can be shown as already due.
 *
 * Idempotent: the marker product "seed-admin-lot-1" means a completed run, and
 * a second run logs and returns.
 */

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons"
const FARM_PHOTOS = [
  `${COMMONS}/e/ee/Sandan_Kohaku.jpg`,
  `${COMMONS}/e/e3/4_year_old_Sanke.jpg`,
  `${COMMONS}/5/5f/Showa.jpg`,
]
const PHONE: Record<string, string> = {
  "budi@koi.dev": "081211110001",
  "siti@koi.dev": "081211110002",
  "agus@koi.dev": "081211110003",
  "dewi@koi.dev": "081211110004",
  "rian@koi.dev": "081211110005",
}
const ADMIN_FALLBACK_EMAIL = "admin@koi.dev"
const SEED_PASSWORD = "supersecret"
const MARKER_HANDLE = "seed-admin-lot-1"

type IdRow = { id: string }
type CustomerRow = IdRow & { email: string | null }

type CustomFieldsService = {
  upsert(alias: string, data: { id: string } & Record<string, unknown>): Promise<unknown>
}
type SellerService = {
  updateSellers(input: { id: string; phone?: string | null }[]): Promise<unknown>
}

const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString()
const DAY = 24 * 60 * 60 * 1000

type HistoryLot = {
  suffix: string
  ob: number
  kb: number
  photo: string
  winner: string
  scenario:
    | "proof_pending"
    | "proof_rejected"
    | "payout_pending_proof"
    | "payout_due"
    | "claim_disputed"
    | "claim_approved"
    | "claim_rejected"
    | "unpaid_report"
    | "payout_paid"
    | "unpaid"
}

const HISTORY_LOTS: HistoryLot[] = [
  {
    suffix: "Kohaku Sansai · 48 cm",
    ob: 2_000_000,
    kb: 100_000,
    photo: FARM_PHOTOS[0],
    winner: "budi@koi.dev",
    scenario: "proof_pending",
  },
  {
    suffix: "Sanke Yonsai · 55 cm",
    ob: 3_500_000,
    kb: 250_000,
    photo: FARM_PHOTOS[1],
    winner: "siti@koi.dev",
    scenario: "proof_rejected",
  },
  {
    suffix: "Showa Nisai · 40 cm",
    ob: 1_500_000,
    kb: 50_000,
    photo: FARM_PHOTOS[2],
    winner: "agus@koi.dev",
    scenario: "payout_pending_proof",
  },
  {
    suffix: "Hi Utsuri Gosai · 62 cm",
    ob: 6_000_000,
    kb: 500_000,
    photo: `${COMMONS}/0/0f/Hi_Utsuri.JPG`,
    winner: "dewi@koi.dev",
    scenario: "payout_due",
  },
  {
    suffix: "Tancho Kohaku · 45 cm",
    ob: 2_500_000,
    kb: 150_000,
    photo: FARM_PHOTOS[0],
    winner: "rian@koi.dev",
    scenario: "claim_disputed",
  },
  {
    suffix: "Asagi Yonsai · 52 cm",
    ob: 1_800_000,
    kb: 100_000,
    photo: FARM_PHOTOS[1],
    winner: "budi@koi.dev",
    scenario: "claim_approved",
  },
  {
    suffix: "Shusui Sansai · 50 cm",
    ob: 2_200_000,
    kb: 200_000,
    photo: FARM_PHOTOS[2],
    winner: "siti@koi.dev",
    scenario: "claim_rejected",
  },
  {
    suffix: "Goshiki Nisai · 38 cm",
    ob: 1_200_000,
    kb: 100_000,
    photo: FARM_PHOTOS[0],
    winner: "budi@koi.dev",
    scenario: "unpaid_report",
  },
  {
    suffix: "Kujaku Sansai · 47 cm",
    ob: 2_800_000,
    kb: 200_000,
    photo: FARM_PHOTOS[1],
    winner: "agus@koi.dev",
    scenario: "payout_paid",
  },
  {
    suffix: "Ochiba Shigure · 42 cm",
    ob: 1_600_000,
    kb: 100_000,
    photo: FARM_PHOTOS[2],
    winner: "rian@koi.dev",
    scenario: "unpaid",
  },
]

// One 18-byte placeholder. The claim record only needs a private key; the
// admin dialog loads it behind a button, so nothing plays it during the seed.
const CLAIM_VIDEO = Buffer.from("koi-unboxing-demo")

export async function seedAdminDemo(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const auctionService = container.resolve<AuctionModuleService>(AUCTION_MODULE)
  const moderationService =
    container.resolve<ModerationModuleService>(MODERATION_MODULE)
  const customFields = container.resolve<CustomFieldsService>(
    MercurModules.CUSTOM_FIELDS
  )
  const sellerService = container.resolve<SellerService>(MercurModules.SELLER)

  const { data: marker } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: MARKER_HANDLE },
  })
  if (marker.length) {
    logger.info(
      `Admin demo data already present (marker ${MARKER_HANDLE}); skipping. Reset the database to rebuild it.`
    )
    return
  }

  const { data: admins } = await query.graph({
    entity: "user",
    fields: ["id"],
    filters: { email: process.env.ADMIN_EMAIL || ADMIN_FALLBACK_EMAIL },
  })
  const adminId = (admins[0] as IdRow | undefined)?.id
  if (!adminId) {
    throw new Error("Admin user not found; run seed-koi.ts first.")
  }

  // Extend window and the company bank the winner transfers to.
  await updatePlatformSettingsWorkflow(container).run({
    input: {
      update: {
        extend_window_minutes: 5,
        claim_window_hours: 4,
        max_lots_per_auction: 20,
        auction_min_days: 1,
        auction_max_days: 7,
        bank_name: "BCA",
        bank_account_number: "1234567890",
        bank_account_holder: "PT Koi Nusantara",
      },
    },
  })
  logger.info("Seeded platform settings (extend window 5 min, BCA account).")

  const { data: customerRows } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
  })
  const customers = customerRows as CustomerRow[]

  // D-011: a wallet needs a complete profile, and the admin list shows a masked
  // phone. Give every seeded customer one before opening wallets.
  for (const customer of customers) {
    const phone = customer.email ? PHONE[customer.email] : undefined
    if (!phone) {
      continue
    }
    await updateCustomersWorkflow(container).run({
      input: {
        selector: { id: customer.id },
        update: { phone: encryptPii(phone) as string },
      },
    })
    await createCustomerWalletWorkflow(container).run({
      input: { customer_id: customer.id },
    })
    await createWalletAdjustmentWorkflow(container).run({
      input: {
        customer_id: customer.id,
        amount: 1_000_000,
        reason: "Saldo awal data demo admin-koi",
        admin_id: adminId,
      },
    })
  }
  logger.info(
    `Gave ${Object.keys(PHONE).length} customers a phone, a wallet and a Rp1.000.000 starting balance.`
  )

  const customerByEmail = new Map(
    customers
      .filter((c): c is IdRow & { email: string } => Boolean(c.email))
      .map((c) => [c.email.toLowerCase(), c.id])
  )
  const customerId = (email: string) => {
    const id = customerByEmail.get(email)
    if (!id) {
      throw new Error(`Seeded customer ${email} not found`)
    }
    return id
  }

  // The demo farm seller carries every history lot.
  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "members.id"],
    filters: { email: "sakura.koi.farm@koi.dev" },
  })
  const seller = sellers[0] as
    | { id: string; name: string; members?: { id: string }[] }
    | undefined
  if (!seller?.members?.[0]?.id) {
    throw new Error("Demo farm seller not found; run seed-koi.ts first.")
  }
  const sellerId = seller.id
  const memberId = seller.members[0].id

  const { data: fees } = await query.graph({
    entity: "fee_category",
    fields: ["id", "name", "listing_fee", "join_fee"],
    pagination: { take: 1, order: { listing_fee: "ASC" } },
  })
  const fee = fees[0] as
    | { id: string; name: string; listing_fee: number; join_fee: number }
    | undefined
  if (!fee) {
    throw new Error("No fee category found; run seed-koi.ts first.")
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { name: "Kohaku" },
  })
  const categoryId = (categories[0] as IdRow | undefined)?.id
  if (!categoryId) {
    throw new Error("Category 'Kohaku' not found; run seed-koi.ts first.")
  }

  // --- Won lots, payments, claims and payouts ------------------------------

  const proofPng = createProofPng()
  const proofBase64 = proofPng.toString("base64")

  const {
    result: historyProducts,
  } = await createProductsWorkflow(container).run({
    input: {
      created_by: memberId,
      products: HISTORY_LOTS.map((lot) => ({
        title: lot.suffix,
        handle: `seed-admin-lot-${HISTORY_LOTS.indexOf(lot) + 1}`,
        description:
          "Koi demo untuk antrean admin: pembayaran, klaim, payout dan laporan.",
        status: ProductStatus.PUBLISHED,
        category_ids: [categoryId],
        thumbnail: lot.photo,
        images: [{ url: lot.photo }],
        weight: 2000,
        variants: [
          {
            title: lot.suffix,
            sku: `ADMINLOT-${HISTORY_LOTS.indexOf(lot) + 1}`,
            options: {},
          },
        ],
      })),
    },
  })

  const now = Date.now()
  const [historyAuction] = await auctionService.createAuctions([
    {
      seller_id: sellerId,
      fee_category_id: fee.id,
      start_at: new Date(now - 4 * DAY),
      end_at: new Date(now - 2 * DAY),
      delivery_method: "courier",
      status: "closed",
      listing_fee: 0,
      join_fee: fee.join_fee,
      extend_window_minutes: 5,
    },
  ])

  const historyLots = await auctionService.createLots(
    HISTORY_LOTS.map((lot) => ({
      auction_id: historyAuction.id,
      product_id: historyProducts[HISTORY_LOTS.indexOf(lot)].id,
      ob: lot.ob,
      kb: lot.kb,
      current_price: lot.ob + lot.kb,
      end_time: new Date(now - 2 * DAY),
      status: "open" as const,
    }))
  )

  await auctionService.createBids(
    HISTORY_LOTS.map((lot, index) => ({
      lot_id: historyLots[index].id,
      customer_id: customerId(lot.winner),
      amount: lot.ob + lot.kb,
      source: "web" as const,
    }))
  )

  for (const lot of historyLots) {
    await closeLotWorkflow(container).run({ input: { lot_id: lot.id } })
  }
  logger.info(`Closed ${historyLots.length} history lots into \`won\` (one bid each).`)

  const lotFor = (scenario: HistoryLot["scenario"]) => {
    const index = HISTORY_LOTS.findIndex((lot) => lot.scenario === scenario)
    return { lot: historyLots[index], plan: HISTORY_LOTS[index] }
  }

  // Payment queue: one proof awaiting review, one rejected proof (decided).
  for (const scenario of ["proof_pending", "proof_rejected"] as const) {
    const { lot, plan } = lotFor(scenario)
    await submitLotPaymentProofWorkflow(container).run({
      input: {
        customer_id: customerId(plan.winner),
        lot_id: lot.id,
        proof: {
          filename: `bukti-transfer-${lot.id}.png`,
          mimeType: "image/png",
          content: proofBase64,
        },
      },
    })
    if (scenario === "proof_rejected") {
      await rejectLotPaymentProofWorkflow(container).run({
        input: {
          lot_id: lot.id,
          reason: "Nominal transfer tidak sesuai dengan harga akhir lot.",
        },
      })
    }
  }
  logger.info("Seeded 1 pending and 1 rejected winner payment proof.")

  const confirmAndShip = async (lotId: string, winnerId: string) => {
    await confirmLotPaymentWorkflow(container).run({
      input: { admin_id: adminId, lot_id: lotId },
    })
    await markLotShippedWorkflow(container).run({
      input: {
        seller_id: sellerId,
        lot_id: lotId,
        tracking_number: `KOI-${lotId.slice(-6).toUpperCase()}`,
      },
    })
    await markLotDeliveredWorkflow(container).run({
      input: { customer_id: winnerId, lot_id: lotId },
    })
  }

  // Paid, shipped and delivered lots, then each scenario's real transition.
  const payoutFor = async (lotId: string) => {
    const { data } = await query.graph({
      entity: "lot_payout",
      fields: ["id", "status"],
      filters: { lot_id: lotId },
    })
    const payout = data[0] as { id: string; status: string } | undefined
    if (!payout) {
      throw new Error(`Payout for lot ${lotId} was not created`)
    }
    return payout
  }

  for (const scenario of [
    "payout_pending_proof",
    "payout_due",
    "claim_disputed",
    "claim_approved",
    "claim_rejected",
    "payout_paid",
  ] as const) {
    const { lot, plan } = lotFor(scenario)
    const winnerId = customerId(plan.winner)

    if (scenario === "payout_due") {
      await confirmLotPaymentWorkflow(container).run({
        input: { admin_id: adminId, lot_id: lot.id },
      })
      await markLotShippedWorkflow(container).run({
        input: {
          seller_id: sellerId,
          lot_id: lot.id,
          tracking_number: `KOI-${lot.id.slice(-6).toUpperCase()}`,
        },
      })
      // Backdate the saved timestamp so the 3-day rule has elapsed; the status
      // itself still comes from markPayoutDueWorkflow.
      await auctionService.updateLots([
        { id: lot.id, shipped_at: new Date(now - 4 * DAY) },
      ])
      const payout = await payoutFor(lot.id)
      await markPayoutDueWorkflow(container).run({
        input: { payout_id: payout.id },
      })
      continue
    }

    await confirmAndShip(lot.id, winnerId)

    if (scenario === "payout_pending_proof") {
      await submitArrivalProofWorkflow(container).run({
        input: {
          customer_id: winnerId,
          lot_id: lot.id,
          proof: {
            filename: `kondisi-koi-${lot.id}.png`,
            mimeType: "image/png",
            content: proofBase64,
          },
        },
      })
      continue
    }

    if (scenario === "payout_paid") {
      await auctionService.updateLots([
        { id: lot.id, delivered_at: new Date(now - 5 * 60 * 60 * 1000) },
      ])
      await submitArrivalProofWorkflow(container).run({
        input: {
          customer_id: winnerId,
          lot_id: lot.id,
          proof: {
            filename: `kondisi-koi-${lot.id}.png`,
            mimeType: "image/png",
            content: proofBase64,
          },
        },
      })
      const payout = await payoutFor(lot.id)
      await payLotPayoutWorkflow(container).run({
        input: {
          payout_id: payout.id,
          admin_id: adminId,
          bank_fee: 6_500,
          transfer_reference: `TRF-${payout.id.slice(-6).toUpperCase()}`,
          note: "Transfer demo ke rekening farm.",
        },
      })
      continue
    }

    // Remaining scenarios are DOA claims: open by the winner, disputed by the
    // farm, then decided by the admin where the scenario says so.
    const { result: claim } = await openClaimWorkflow(container).run({
      input: {
        customer_id: winnerId,
        lot_id: lot.id,
        remedy: "refund",
        video: {
          filename: `unboxing-${lot.id}.mp4`,
          mimeType: "video/mp4",
          content: CLAIM_VIDEO.toString("base64"),
        },
      },
    })
    await disputeClaimWorkflow(container).run({
      input: { seller_id: sellerId, claim_id: claim.id },
    })
    if (scenario === "claim_approved") {
      await approveClaimWorkflow(container).run({
        input: {
          claim_id: claim.id,
          admin_id: adminId,
          reason: "Video unboxing menunjukkan koi tidak hidup saat diterima.",
        },
      })
    }
    if (scenario === "claim_rejected") {
      await rejectClaimWorkflow(container).run({
        input: {
          claim_id: claim.id,
          admin_id: adminId,
          reason: "Video tidak menunjukkan segel kemasan dibuka pertama kali.",
        },
      })
    }
  }
  logger.info(
    "Seeded 1 pending payout with arrival proof, 1 due payout, 1 paid payout, and 3 claims (1 disputed, 1 approved, 1 rejected)."
  )

  // --- Report archive (D-079: read-only rows, no creation workflow) --------

  const reportLots = (["unpaid_report", "unpaid"] as const).map((scenario) =>
    lotFor(scenario)
  )
  await moderationService.createLotReports(
    reportLots.map(({ lot, plan }) => ({
      lot_id: lot.id,
      seller_id: sellerId,
      winner_customer_id: customerId(plan.winner),
      status: "open" as const,
    }))
  )
  logger.info(`Seeded ${reportLots.length} archived non-payment reports.`)

  // --- Top-up requests -----------------------------------------------------

  const topup = async (
    email: string,
    amount: number,
    decision: "pending" | "approve" | "reject"
  ) => {
    const { result } = await createTopupRequestWorkflow(container).run({
      input: {
        customer_id: customerId(email),
        amount,
        screenshot: {
          filename: `bukti-topup-${email.split("@")[0]}.png`,
          mimeType: "image/png",
          content: proofBase64,
        },
      },
    })
    if (decision !== "pending") {
      await decideTopupRequestWorkflow(container).run({
        input: {
          id: result.id,
          action: decision,
          admin_id: adminId,
          ...(decision === "approve"
            ? { bank_reference: "MUTASI-DEMO-001" }
            : { reason: "Bukti transfer tidak cocok dengan mutasi bank." }),
        },
      })
    }
  }

  await topup("budi@koi.dev", 250_000, "pending")
  await topup("siti@koi.dev", 500_000, "pending")
  await topup("agus@koi.dev", 300_000, "approve")
  await topup("dewi@koi.dev", 1_000_000, "reject")
  logger.info("Seeded 2 pending top-ups, 1 approved and 1 rejected.")

  // --- Auction approval queue ---------------------------------------------

  for (const [index, startDays] of [1, 2].entries()) {
    const { result } = await createAuctionWorkflow(container).run({
      input: {
        seller_id: sellerId,
        member_id: memberId,
        customer_id: customerId("sakura.koi.farm@koi.dev"),
        fee_category_id: fee.id,
        start_at: isoIn(startDays * DAY),
        end_at: isoIn((startDays + 3) * DAY),
        delivery_method: "courier",
        lots: [
          {
            title: `Lelang antrean ${index + 1} · Kohaku`,
            description: "Lot contoh untuk antrean persetujuan lelang.",
            photos: [FARM_PHOTOS[0]],
            ob: 2_000_000,
            kb: 100_000,
            variety: "Kohaku",
            size_cm: 45,
          },
          {
            title: `Lelang antrean ${index + 1} · Showa`,
            description: "Lot contoh untuk antrean persetujuan lelang.",
            photos: [FARM_PHOTOS[2]],
            ob: 2_500_000,
            kb: 150_000,
            variety: "Showa",
            size_cm: 50,
          },
        ],
      },
    })
    await submitAuctionWorkflow(container).run({
      input: {
        seller_id: sellerId,
        auction_id: result.auction.id,
        customer_id: customerId("sakura.koi.farm@koi.dev"),
      },
    })
  }
  logger.info("Seeded 2 auctions into the pending-approval queue.")

  // --- Customer strikes (one banned account on /pengguna) ------------------

  for (let i = 0; i < 2; i++) {
    await giveStrikeWorkflow(container).run({
      input: {
        customer_id: customerId("rian@koi.dev"),
        reason_type: "winner_unpaid",
        reason:
          i === 0
            ? "Memenangkan lot tetapi tidak membayar dalam 1×24 jam."
            : "Pemenang kembali tidak membayar lot kedua.",
        admin_id: adminId,
      },
    })
  }
  logger.info("Gave rian@koi.dev two active strikes (derived ban).")

  // --- Farm registrations --------------------------------------------------

  const ktpKey = (
    await uploadFilesWorkflow(container).run({
      input: {
        files: [
          {
            filename: "ktp-demo.png",
            mimeType: "image/png",
            content: proofBase64,
            access: "private",
          },
        ],
      },
    })
  ).result[0].id

  // Every approved farm keeps its KTP and photos, so the decided rows open a
  // detail dialog with media instead of empty placeholders.
  const { data: openSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { status: "open" },
  })
  for (const row of openSellers as IdRow[]) {
    await customFields.upsert("seller", {
      id: row.id,
      ktp_photo_key: ktpKey,
      ktp_nik: encryptPii("3273012345678901"),
      farm_photo_urls: FARM_PHOTOS,
    })
  }
  logger.info(
    `Attached KTP and farm photos to ${openSellers.length} approved sellers.`
  )

  const pendingFarms = [
    {
      name: "Dana Koi Farm",
      email: "dana.koi.farm@koi.dev",
      first: "Dana",
      last: "Pratama",
      phone: "081299990001",
      city: "Bogor",
      province: "Jawa Barat",
      address: "Jl. Raya Cibinong 21",
      bank: "BCA",
      account: "9876543210",
    },
    {
      name: "Nusa Koi",
      email: "nusa.koi@koi.dev",
      first: "Nusa",
      last: "Aditya",
      phone: "081299990002",
      city: "Blitar",
      province: "Jawa Timur",
      address: "Jl. Soekarno Hatta 88",
      bank: "Mandiri",
      account: "1122334455",
    },
  ]

  const authModuleService = container.resolve(Modules.AUTH)
  for (const farm of pendingFarms) {
    const registered = await authModuleService.register("emailpass", {
      body: { email: farm.email, password: SEED_PASSWORD },
    })
    const authIdentityId = registered.success && registered.authIdentity
      ? registered.authIdentity.id
      : (
          await authModuleService.listProviderIdentities({
            entity_id: farm.email,
            provider: "emailpass",
          })
        )[0].auth_identity_id
    if (!authIdentityId) {
      throw new Error(`Could not register auth identity for ${farm.email}`)
    }

    const { result: customer } = await createCustomerAccountWorkflow(
      container
    ).run({
      input: {
        authIdentityId,
        customerData: {
          email: farm.email,
          first_name: farm.first,
          last_name: farm.last,
          phone: encryptPii(farm.phone) as string,
        },
      },
    })

    const identity = await authModuleService.retrieveAuthIdentity(
      authIdentityId
    )
    await authModuleService.updateAuthIdentities({
      id: authIdentityId,
      app_metadata: {
        ...identity.app_metadata,
        customer_id: customer.id,
      },
    })

    const { result: createdSeller } = await createSellerAccountWorkflow(
      container
    ).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: farm.email,
        first_name: farm.first,
        last_name: farm.last,
        seller: {
          name: farm.name,
          email: farm.email,
          currency_code: "idr",
          description: `${farm.name} — pembudidaya koi di ${farm.city}, ${farm.province}.`,
          logo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
            farm.name
          )}`,
          banner: `https://picsum.photos/seed/${encodeURIComponent(farm.name)}/1200/320`,
          metadata: {
            kind: "farm",
            location: `${farm.city}, ${farm.province}`,
            speciality: "Kohaku",
            rating: 4.5,
          },
          is_premium: false,
        },
        address: {
          address_1: farm.address,
          city: farm.city,
          province: farm.province,
          country_code: "id",
        },
        payment_details: {
          country_code: "id",
          bank_name: farm.bank,
          holder_name: encryptPii(`${farm.first} ${farm.last}`) as string,
          account_number: encryptPii(farm.account) as string,
        },
        additional_data: {
          ktp_photo_key: ktpKey,
          ktp_nik: encryptPii("3273012345678901"),
          farm_photo_urls: FARM_PHOTOS,
        },
      },
    })

    // Mercur's CreateSellerDTO has no phone column, so the registration
    // middleware normally copies it on; the seed writes it directly.
    await sellerService.updateSellers([
      { id: createdSeller.id, phone: encryptPii(farm.phone) },
    ])
  }
  logger.info(
    `Seeded ${pendingFarms.length} pending farm registrations with KTP, photos and bank details.`
  )

  // --- Row counts for the hand-off report ---------------------------------

  const count = async (entity: string) => {
    const { data, metadata } = await query.graph({
      entity,
      fields: ["id"],
      pagination: { take: 10_000 },
    })
    return metadata?.count ?? data.length
  }
  const counts = {
    sellers: await count("seller"),
    topups: await count("topup_request"),
    auctions: await count("auction"),
    lots: await count("lot"),
    bids: await count("bid"),
    claims: await count("claim"),
    reports: await count("lot_report"),
    payouts: await count("lot_payout"),
    wallet_transactions: await count("wallet_transaction"),
  }
  logger.info(
    `Admin demo data ready: ${Object.entries(counts)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ")}.`
  )
  logger.info("Finished seeding admin demo data.")
}
