import fs from "node:fs"

import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { AUCTION_MODULE } from "../src/modules/auction"
import type AuctionModuleService from "../src/modules/auction/service"

/* TEMPORARY render-check seed for US-052 T-052.2. Not part of the app.
   `seed` creates one closed auction under Sakura Koi Farm with one `paid`
   courier lot (farmer ships it in the check) and one `shipped` lot (winner
   marks it delivered); `clean` deletes exactly those rows. Ids are kept
   in /tmp/koi-render-ids.json so `clean` never touches anyone else's data. */

const IDS = "/tmp/koi-render-ids.json"

export default async function run({ container, args }: ExecArgs) {
  const mode = args[0]
  const auctions = container.resolve<AuctionModuleService>(AUCTION_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (mode === "clean") {
    if (!fs.existsSync(IDS)) {
      console.log("no ids file; nothing to clean")
      return
    }
    const ids = JSON.parse(fs.readFileSync(IDS, "utf8")) as {
      lots: string[]
      auction: string
      products: string[]
    }
    await auctions.deleteLots(ids.lots)
    await auctions.deleteAuctions(ids.auction)
    await container.resolve(Modules.PRODUCT).deleteProducts(ids.products)
    fs.unlinkSync(IDS)
    console.log(`cleaned ${ids.lots.length} lots, 1 auction, ${ids.products.length} products`)
    return
  }

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { name: "Sakura Koi Farm" },
  })
  if (!seller) throw new Error("Sakura Koi Farm not seeded")

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name"],
    filters: { email: "budi@koi.dev" },
  })
  if (!customer) throw new Error("winner customer not seeded")

  const {
    data: [category],
  } = await query.graph({ entity: "fee_category", fields: ["id"] })
  if (!category) throw new Error("no fee category seeded")

  const stamp = Date.now()
  const products = await container.resolve(Modules.PRODUCT).createProducts([
    {
      title: `Kohaku Render US052 ${stamp} A`,
      description: "Temporary render-check lot.",
      status: "draft" as never,
      thumbnail: "https://picsum.photos/seed/koi-render-a/1200/900",
      images: [{ url: "https://picsum.photos/seed/koi-render-a/1200/900" }],
    },
    {
      title: `Kohaku Render US052 ${stamp} B`,
      description: "Temporary render-check lot.",
      status: "draft" as never,
      thumbnail: "https://picsum.photos/seed/koi-render-b/1200/900",
      images: [{ url: "https://picsum.photos/seed/koi-render-b/1200/900" }],
    },
  ])

  const start = Date.now() - 5 * 24 * 60 * 60 * 1000
  const [auction] = await auctions.createAuctions([
    {
      seller_id: seller.id,
      fee_category_id: category.id,
      start_at: new Date(start),
      end_at: new Date(start + 3 * 24 * 60 * 60 * 1000),
      delivery_method: "courier",
      status: "closed",
      listing_fee: 50_000,
      join_fee: 100_000,
      extend_window_minutes: 5,
    },
  ])
  const lots = await auctions.createLots([
    {
      auction_id: auction.id,
      product_id: products[0].id,
      ob: 1_000_000,
      kb: 100_000,
      current_price: 1_500_000,
      end_time: new Date(start + 3 * 24 * 60 * 60 * 1000),
      status: "paid",
      winner_customer_id: customer.id,
      final_price: 1_500_000,
      closed_at: new Date(start + 3 * 24 * 60 * 60 * 1000),
    },
    {
      auction_id: auction.id,
      product_id: products[1].id,
      ob: 1_000_000,
      kb: 100_000,
      current_price: 1_500_000,
      end_time: new Date(start + 3 * 24 * 60 * 60 * 1000),
      status: "shipped",
      winner_customer_id: customer.id,
      final_price: 1_500_000,
      closed_at: new Date(start + 3 * 24 * 60 * 60 * 1000),
      tracking_number: "SICEPAT999",
      shipped_at: new Date(start + 4 * 24 * 60 * 60 * 1000),
    },
  ])

  fs.writeFileSync(
    IDS,
    JSON.stringify({
      lots: lots.map((l) => l.id),
      auction: auction.id,
      products: products.map((p) => p.id),
    })
  )
  console.log(`seeded seller=${seller.id} winner=${customer.id} lots=${lots.map((l) => l.id).join(",")}`)
}
