import { defineLink } from "@medusajs/framework/utils"
import SellerModule from "@mercurjs/core/modules/seller"
import AuctionModule from "../modules/auction"

// Many auctions per seller. `seller_id` is a plain column on `auction`; the
// link (readOnly, like Mercur's offer-seller-link) is how Query walks from an
// auction to its seller. No foreign key into another module's table
// (best-practices/modules).
export default defineLink(
  { linkable: AuctionModule.linkable.auction, field: "seller_id" },
  SellerModule.linkable.seller,
  { readOnly: true }
)
