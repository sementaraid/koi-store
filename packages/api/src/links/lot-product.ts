import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import AuctionModule from "../modules/auction"

// One product (the koi listing: photos, title, description) → one lot.
// `product_id` is a plain column on `lot`; the link is how Query reaches the
// product from the lot, never a foreign key.
export default defineLink(
  { linkable: AuctionModule.linkable.lot, field: "product_id" },
  ProductModule.linkable.product,
  { readOnly: true }
)
