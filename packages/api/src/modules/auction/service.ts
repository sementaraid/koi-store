import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { Auction } from "./models/auction"
import { AuctionParticipant } from "./models/auction-participant"
import { Bid } from "./models/bid"
import { Lot } from "./models/lot"
import { LotParticipant } from "./models/lot-participant"

export type AuctionDTO = InferEntityType<typeof Auction>
export type LotDTO = InferEntityType<typeof Lot>
export type BidDTO = InferEntityType<typeof Bid>
export type AuctionParticipantDTO = InferEntityType<typeof AuctionParticipant>
export type LotParticipantDTO = InferEntityType<typeof LotParticipant>

// Thin CRUD only (best-practices/modules). Seller, fee category and product
// are read through readOnly links (src/links/), never by calling another
// module's service.
class AuctionModuleService extends MedusaService({
  Auction,
  Lot,
  Bid,
  AuctionParticipant,
  LotParticipant,
}) {}

export default AuctionModuleService
