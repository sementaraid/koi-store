import { MedusaService } from "@medusajs/framework/utils"
import type { InferEntityType } from "@medusajs/framework/types"
import { Auction } from "./models/auction"
import { AuctionParticipant } from "./models/auction-participant"
import { Lot } from "./models/lot"

export type AuctionDTO = InferEntityType<typeof Auction>
export type LotDTO = InferEntityType<typeof Lot>
export type AuctionParticipantDTO = InferEntityType<typeof AuctionParticipant>

// Thin CRUD only (best-practices/modules). Seller, fee category and product
// are read through readOnly links (src/links/), never by calling another
// module's service.
class AuctionModuleService extends MedusaService({
  Auction,
  Lot,
  AuctionParticipant,
}) {}

export default AuctionModuleService
