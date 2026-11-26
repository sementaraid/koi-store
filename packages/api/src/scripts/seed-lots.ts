import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@mercurjs/core/workflows"

import { AUCTION_MODULE } from "../modules/auction"
import type AuctionModuleService from "../modules/auction/service"

/*
 * Auction + lot seed — the rows `/lelang` and `/lelang/<id>`
 * need. `seed-koi.ts` deliberately seeds none (see its
 * header), so this runs after it and only needs what that seed leaves behind:
 * sellers, a fee category and the Indonesia region.
 *
 * Direct module writes, like the rest of seed-koi.ts: an auction is a job-time
 * state here, not a fee-bearing action, so no wallet is touched and no
 * workflow's guards apply. Products still go through the product workflow so
 * their links, sales channel and category joins stay consistent.
 *
 * Idempotent: a re-run replaces the auction this seeder owns (found through
 * its own products, see below) instead of adding a second copy.
 */

// Demo live link (D-061 / US-106 AC3): a real URL the lot page can render as
// the farmer's outbound "Tonton siaran farm" link. The video id is a
// placeholder; isLiveStreamUrl() only checks the https YouTube/Instagram shape.
const DEMO_LIVE_STREAM_URL = "https://www.youtube.com/live/abc123"
const COUNTRY = "id"
const CURRENCY = "idr"

type LotPlan = {
  suffix: string
  ob: number
  kb: number
  photo: string
  /** Minutes from now; negative = already ended. */
  endsInMinutes: number
  bids: { amount: number }[]
}

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons"

const LOTS: LotPlan[] = [
  {
    suffix: "Kohaku Sansai · 48 cm",
    ob: 2_000_000,
    kb: 100_000,
    photo: `${COMMONS}/e/ee/Sandan_Kohaku.jpg`,
    endsInMinutes: 60 * 24 * 3,
    bids: [{ amount: 2_100_000 }, { amount: 2_300_000 }, { amount: 2_450_000 }],
  },
  {
    suffix: "Sanke Yonsai · 55 cm",
    ob: 3_500_000,
    kb: 250_000,
    photo: `${COMMONS}/e/e3/4_year_old_Sanke.jpg`,
    endsInMinutes: 60 * 24 * 5,
    bids: [{ amount: 3_750_000 }, { amount: 4_000_000 }],
  },
  {
    suffix: "Showa Nisai · 40 cm",
    ob: 1_500_000,
    kb: 50_000,
    photo: `${COMMONS}/5/5f/Showa.jpg`,
    endsInMinutes: 60 * 12,
    bids: [{ amount: 1_550_000 }],
  },
  {
    suffix: "Hi Utsuri Gosai · 62 cm",
    ob: 6_000_000,
    kb: 500_000,
    photo: `${COMMONS}/0/0f/Hi_Utsuri.JPG`,
    endsInMinutes: 60 * 24 * 7,
    bids: [{ amount: 6_500_000 }],
  },
]

// Deterministic product handle: this is the seeder's ownership marker.
// `product.handle` is unique, and only this script creates `seed-lelang-*`.
const productHandle = (suffix: string) =>
  `seed-lelang-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000)

export default async function seedLots({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const auctionService = container.resolve<AuctionModuleService>(AUCTION_MODULE)
  const productService = container.resolve(Modules.PRODUCT)

  // Replace this seeder's own data (not anyone else's): its four products (by
  // their deterministic handle), the auction their lots belong to, those lots
  // and their bids. Re-running refreshes end times, photos and the demo live
  // link instead of leaving yesterday's expired copy behind.
  //
  // Marker: the auction row has no title/slug column, and `live_stream_url` is
  // a URL (D-061), not a marker. The products this seeder creates are unique
  // and stable, so the previous auction is found through their lots.
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: LOTS.map((lot) => productHandle(lot.suffix)) },
  })
  const seededProductIds = (seededProducts as { id: string }[]).map((p) => p.id)
  const oldLots = (
    seededProductIds.length
      ? (
          await query.graph({
            entity: "lot",
            fields: ["auction_id"],
            filters: { product_id: seededProductIds },
          })
        ).data
      : []
  ) as { auction_id: string }[]
  const auctionIds = [...new Set(oldLots.map((lot) => lot.auction_id))]

  // Re-read the whole auction, so every lot and bid is removed even if one of
  // the products above was deleted by hand.
  const oldAuctions = (
    auctionIds.length
      ? (
          await query.graph({
            entity: "auction",
            fields: ["id", "lots.id", "lots.bids.id"],
            filters: { id: auctionIds },
          })
        ).data
      : []
  ) as { id: string; lots?: { id: string; bids?: { id: string }[] }[] }[]
  const oldLotRows = oldAuctions.flatMap((auction) => auction.lots ?? [])
  const bidIds = oldLotRows.flatMap((lot) => (lot.bids ?? []).map((b) => b.id))
  const lotIds = oldLotRows.map((lot) => lot.id)

  if (bidIds.length) await auctionService.deleteBids(bidIds)
  if (lotIds.length) await auctionService.deleteLots(lotIds)
  if (auctionIds.length) await auctionService.deleteAuctions(auctionIds)
  if (seededProductIds.length) {
    await productService.deleteProducts(seededProductIds)
  }
  if (auctionIds.length) {
    logger.info(`Replaced earlier seeded auction ${auctionIds.join(", ")}.`)
  }

  // The first farm in seed-koi.ts's list; its email is derived from the name.
  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: "sakura.koi.farm@koi.dev" },
  })
  const seller = sellers[0] as { id: string } | undefined
  if (!seller) {
    throw new Error("No farm seller found — run `bun run seed` first.")
  }

  const { data: fees } = await query.graph({
    entity: "fee_category",
    fields: ["id", "join_fee"],
    pagination: { take: 1 },
  })
  const fee = fees[0] as { id: string; join_fee: number } | undefined
  if (!fee) {
    throw new Error("No fee category found — run `bun run seed` first.")
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: "Kohaku" },
  })
  const categoryId = (categories[0] as { id: string } | undefined)?.id
  if (!categoryId) {
    throw new Error("Category 'Kohaku' not found — run `bun run seed` first.")
  }

  const { data: members } = await query.graph({
    entity: "seller",
    fields: ["id", "members.id"],
    filters: { id: seller.id },
  })
  const memberId = (members[0] as { members?: { id: string }[] })?.members?.[0]?.id
  if (!memberId) {
    throw new Error("Farm seller has no member — run `bun run seed` first.")
  }

  logger.info("Seeding auction products...")
  const products = LOTS.map((lot) => ({
    title: lot.suffix,
    handle: productHandle(lot.suffix),
    description:
      "Koi contoh untuk mencoba ruang lelang. Foto, ukuran dan harga hanya data demo.",
    status: ProductStatus.PUBLISHED,
    category_ids: [categoryId],
    thumbnail: lot.photo,
    images: [{ url: lot.photo }],
    weight: 2000,
    variants: [
      {
        title: lot.suffix,
        sku: `SEEDLOT-${lot.suffix.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
        options: {},
      },
    ],
  }))

  const {
    result: createdProducts,
  } = await createProductsWorkflow(container).run({
    input: { created_by: memberId, products },
  })

  logger.info(`Seeding auction and ${LOTS.length} lots...`)
  const now = new Date()
  // Longer than any lot, so no lot outlives its auction.
  const endAt = minutesFromNow(60 * 24 * 8)

  const [auction] = await auctionService.createAuctions([
    {
      seller_id: seller.id,
      fee_category_id: fee.id,
      start_at: new Date(now.getTime() - 30 * 60_000),
      end_at: endAt,
      delivery_method: "courier",
      status: "live",
      listing_fee: 0,
      join_fee: fee.join_fee,
      extend_window_minutes: 5,
      live_stream_url: DEMO_LIVE_STREAM_URL,
    },
  ])

  const lots = await auctionService.createLots(
    LOTS.map((plan, index) => {
      const currentPrice = plan.bids.length
        ? plan.bids[plan.bids.length - 1].amount
        : plan.ob
      return {
        auction_id: auction.id,
        product_id: createdProducts[index].id,
        ob: plan.ob,
        kb: plan.kb,
        current_price: currentPrice,
        end_time: minutesFromNow(plan.endsInMinutes),
        status: "open" as const,
      }
    })
  )

  const { data: buyers } = await query.graph({
    entity: "customer",
    fields: ["id"],
    pagination: { take: 3 },
  })
  const buyerIds = (buyers as { id: string }[]).map((b) => b.id)
  if (!buyerIds.length) {
    throw new Error("No customer found — run `bun run seed` first.")
  }

  const bids = LOTS.flatMap((plan, lotIndex) =>
    plan.bids.map((bid, bidIndex) => ({
      lot_id: lots[lotIndex].id,
      customer_id: buyerIds[bidIndex % buyerIds.length],
      amount: bid.amount,
      source: "web" as const,
    }))
  )
  if (bids.length) await auctionService.createBids(bids)

  // Bidding requires a paid participant (workflows/steps/bid.ts), so seed one
  // per distinct bidder. Skip anyone already joined, so a re-run is safe.
  const bidderIds = [...new Set(bids.map((bid) => bid.customer_id))]
  const joined = new Set(
    (
      await auctionService.listAuctionParticipants({ auction_id: auction.id })
    ).map((participant) => participant.customer_id)
  )
  const newBidderIds = bidderIds.filter((id) => !joined.has(id))
  if (newBidderIds.length) {
    await auctionService.createAuctionParticipants(
      newBidderIds.map((customer_id) => ({
        auction_id: auction.id,
        customer_id,
      }))
    )
  }

  logger.info(
    `Seeded auction ${auction.id} with ${LOTS.length} lots, ${bids.length} bids and ${bidderIds.length} participants.`
  )
  logger.info(`Open /lelang/${lots[0].id} to bid on the lot page.`)
}
