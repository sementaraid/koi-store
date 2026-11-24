import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { SellerStatus } from "@mercurjs/types"

import { walletBalance } from "../api/store/wallet/route"
import { AUCTION_MODULE } from "../modules/auction"
import type AuctionModuleService from "../modules/auction/service"
import { PLATFORM_SETTING_DEFAULTS } from "../modules/platform-settings/defaults"
import { encryptPii } from "../utils/pii-crypto"
import { createCustomerWalletWorkflow } from "../workflows/create-customer-wallet"
import { createWalletAdjustmentWorkflow } from "../workflows/create-wallet-adjustment"
import { authIdentityFor } from "./seed-koi"

/*
 * US-099 QA fixture (owner-authorized 2026-11-24). A separate, clearly marked
 * live auction plus a funded test customer, so qa can join and bid without
 * touching the demo auction. Dev and prod share one database: everything here
 * is visible on production and is removed by the admin cancel flow (US-091).
 *
 * Auction and lots: direct module writes like seed-lots.ts. Products go
 * through the product workflow. The balance goes through the admin
 * "Koreksi saldo" workflow (US-013), never a hand-written ledger row.
 *
 * Idempotent: a marked auction that is still live is kept; the customer, its
 * wallet and the one credit are each created only when missing.
 */

const TEST_AUCTION_MARKER = "UJI QA · jangan dipakai"
const FARM_EMAIL = "nusantara.nishikigoi@koi.dev"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@koi.dev"
const CREDIT_REASON = "Saldo uji QA US-099"
const CREDIT = 500_000

const TEST_CUSTOMER = {
  email: "uji.qa@koi.dev",
  password: "supersecret",
  first_name: "Uji",
  last_name: "QA",
  // Placeholder, never a real number.
  phone: "080000000099",
}

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons"
const LOTS = [
  {
    title: "[UJI] Kohaku Nisai · 45 cm",
    ob: 2_000_000,
    kb: 100_000,
    photo: `${COMMONS}/e/ee/Sandan_Kohaku.jpg`,
    endsInMinutes: 180,
  },
  {
    title: "[UJI] Showa Sansai · 50 cm",
    ob: 1_500_000,
    kb: 50_000,
    photo: `${COMMONS}/5/5f/Showa.jpg`,
    endsInMinutes: 50,
  },
]

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000)

const wib = (d: Date | string) =>
  new Date(d).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB"

export default async function seedTestAuction({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const auctionService = container.resolve<AuctionModuleService>(AUCTION_MODULE)

  // --- Auction --------------------------------------------------------------
  const { data: existing } = await query.graph({
    entity: "auction",
    fields: ["id", "status", "lots.id", "lots.end_time"],
    filters: { live_stream_url: TEST_AUCTION_MARKER, status: "live" },
  })
  const live = existing[0] as
    | { id: string; lots?: { id: string; end_time: string }[] }
    | undefined

  if (live) {
    logger.info(`Test auction ${live.id} is still live, skipping.`)
    for (const lot of live.lots ?? []) {
      logger.info(`  lot ${lot.id} ends ${wib(lot.end_time)}`)
    }
  } else {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "status", "members.id"],
      filters: { email: FARM_EMAIL },
    })
    const seller = sellers[0] as
      | { id: string; name: string; status: string; members?: { id: string }[] }
      | undefined
    if (!seller || seller.status !== SellerStatus.OPEN) {
      throw new Error(`Farm ${FARM_EMAIL} missing or not open — run \`bun run seed\` first.`)
    }
    const memberId = seller.members?.[0]?.id
    if (!memberId) throw new Error(`Farm ${FARM_EMAIL} has no member.`)

    // plan.md fee table: Lokal without certificate, join fee Rp100.000.
    const { data: fees } = await query.graph({
      entity: "fee_category",
      fields: ["id", "name", "join_fee"],
    })
    const lokal = (fees as { id: string; name: string; join_fee: number }[]).filter(
      (f) => /^lokal/i.test(f.name) && Number(f.join_fee) === 100_000
    )
    if (lokal.length !== 1) {
      throw new Error(
        `Expected one Lokal fee category with join fee 100000, found ${lokal.length}.`
      )
    }
    const fee = lokal[0]

    const {
      data: [settings],
    } = await query.graph({
      entity: "platform_setting",
      fields: ["extend_window_minutes"],
      pagination: { take: 1 },
    })
    const extendWindow =
      (settings as { extend_window_minutes?: number } | undefined)
        ?.extend_window_minutes ?? PLATFORM_SETTING_DEFAULTS.extend_window_minutes

    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { name: "Kohaku" },
    })
    const categoryId = (categories[0] as { id: string } | undefined)?.id
    if (!categoryId) throw new Error("Category 'Kohaku' not found.")

    // Handles and SKUs carry a run stamp, so a re-run after a cancel never
    // collides with the previous fixture's products.
    const stamp = Date.now().toString(36)
    const { result: products } = await createProductsWorkflow(container).run({
      input: {
        created_by: memberId,
        products: LOTS.map((lot, i) => ({
          title: lot.title,
          handle: `uji-qa-${stamp}-${i + 1}`,
          description: "Data uji QA. Bukan lot sungguhan, jangan ikut atau bid.",
          status: ProductStatus.PUBLISHED,
          category_ids: [categoryId],
          thumbnail: lot.photo,
          images: [{ url: lot.photo }],
          weight: 2000,
          variants: [
            { title: lot.title, sku: `UJIQA-${stamp}-${i + 1}`.toUpperCase(), options: {} },
          ],
        })),
      },
    })

    const [auction] = await auctionService.createAuctions([
      {
        seller_id: seller.id,
        fee_category_id: fee.id,
        start_at: minutesFromNow(-5),
        // Longer than any lot, so no lot outlives its auction.
        end_at: minutesFromNow(240),
        delivery_method: "courier",
        status: "live",
        listing_fee: 0,
        join_fee: Number(fee.join_fee),
        extend_window_minutes: extendWindow,
        live_stream_url: TEST_AUCTION_MARKER,
      },
    ])

    const lots = await auctionService.createLots(
      LOTS.map((plan, i) => ({
        auction_id: auction.id,
        product_id: products[i].id,
        ob: plan.ob,
        kb: plan.kb,
        current_price: plan.ob,
        end_time: minutesFromNow(plan.endsInMinutes),
        status: "open" as const,
      }))
    )

    logger.info(
      `Created test auction ${auction.id} (farm ${seller.name}, fee category "${fee.name}", join fee ${fee.join_fee}, extend ${extendWindow} min).`
    )
    lots.forEach((lot, i) =>
      logger.info(`  lot ${lot.id} "${LOTS[i].title}" ends ${wib(lot.end_time)}`)
    )
  }

  // --- Test customer --------------------------------------------------------
  const authIdentityId = await authIdentityFor(
    container,
    TEST_CUSTOMER.email,
    TEST_CUSTOMER.password
  )
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email: TEST_CUSTOMER.email },
  })
  let customerId = (customers[0] as { id: string } | undefined)?.id
  if (!customerId) {
    const { result } = await createCustomerAccountWorkflow(container).run({
      input: {
        authIdentityId,
        customerData: {
          email: TEST_CUSTOMER.email,
          first_name: TEST_CUSTOMER.first_name,
          last_name: TEST_CUSTOMER.last_name,
          // D-043: the phone column holds ciphertext; scripts skip the HTTP
          // write middleware.
          phone: encryptPii(TEST_CUSTOMER.phone) as string,
        },
      },
    })
    customerId = result.id
  }

  // D-011: name + phone complete, so this creates the wallet (or finds it).
  await createCustomerWalletWorkflow(container).run({
    input: { customer_id: customerId },
  })
  const {
    data: [walletRow],
  } = await query.graph({
    entity: "customer",
    fields: ["wallet.id"],
    filters: { id: customerId },
  })
  const walletId = (walletRow as { wallet?: { id: string } } | undefined)?.wallet?.id
  if (!walletId) throw new Error(`Customer ${customerId} has no wallet.`)

  // One credit, ever: skip when this reason is already on the ledger.
  const { data: credited } = await query.graph({
    entity: "wallet_transaction",
    fields: ["id"],
    filters: { wallet_id: walletId, type: "adjustment", reference: CREDIT_REASON },
  })
  if (!credited.length) {
    const { data: admins } = await query.graph({
      entity: "user",
      fields: ["id"],
      filters: { email: ADMIN_EMAIL },
    })
    const adminId = (admins[0] as { id: string } | undefined)?.id
    if (!adminId) throw new Error(`Admin user ${ADMIN_EMAIL} not found.`)

    await createWalletAdjustmentWorkflow(container).run({
      input: {
        customer_id: customerId,
        amount: CREDIT,
        reason: CREDIT_REASON,
        admin_id: adminId,
      },
    })
    logger.info(`Credited ${CREDIT} to ${TEST_CUSTOMER.email} ("${CREDIT_REASON}").`)
  } else {
    logger.info(`${TEST_CUSTOMER.email} already has the QA credit, skipping.`)
  }

  logger.info(
    `Test customer ${customerId} (${TEST_CUSTOMER.email}), wallet ${walletId}, balance ${await walletBalance(container, walletId)}.`
  )
}
