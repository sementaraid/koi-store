import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateDraftAuctionWorkflow } from "../../../../workflows/update-draft-auction"
import {
  AUCTION_FIELDS,
  LOT_WITH_PHOTOS_FIELDS,
  type AuctionLotWithPhotos,
  toLotWithPhotos,
  toVendorAuction,
  type VendorAuction,
  type VendorAuctionResponse,
} from "../route"
import type { VendorUpdateAuctionType } from "../validators"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../../types/seller-context"

export type VendorAuctionDetail = Omit<VendorAuction, "lots"> & {
  lots: AuctionLotWithPhotos[]
}
export type VendorAuctionDetailResponse = { auction: VendorAuctionDetail }

// One of the caller's auctions with its lots and their photos. Another
// seller's auction is 404, like the draft-edit guard.
export const getVendorAuctionDetail = async (
  scope: MedusaContainer,
  sellerId: string,
  auctionId: string
): Promise<VendorAuctionDetail> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [auction],
  } = await query.graph({
    entity: "auction",
    fields: [
      ...AUCTION_FIELDS,
      ...LOT_WITH_PHOTOS_FIELDS.map((field) => `lots.${field}`),
    ],
    filters: { id: auctionId, seller_id: sellerId },
  })
  if (!auction) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Auction ${auctionId} was not found`
    )
  }
  return {
    ...toVendorAuction(auction),
    lots: ((auction.lots ?? []) as Record<string, unknown>[]).map(toLotWithPhotos),
  }
}

// US-032 AC4 / T-032.5: the farmer reads the rejection reason and the lots to
// fix before resubmitting.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorAuctionDetailResponse>
) => {
  res.json({
    auction: await getVendorAuctionDetail(
      req.scope,
      req.seller_context!.seller_id,
      req.params.id
    ),
  })
}

// US-030 AC8: edit a draft. Update is a POST to the resource
// (best-practices/api-routes: only GET/POST/DELETE). Any other status is
// refused by getDraftAuctionStep (409), another seller's auction is 404.
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateAuctionType>,
  res: MedusaResponse<VendorAuctionResponse>
) => {
  const { start_at, end_at, ...rest } = req.validatedBody
  const { result } = await updateDraftAuctionWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      auction_id: req.params.id,
      update: {
        ...rest,
        // Workflow input crosses steps as JSON, so dates go as ISO strings.
        ...(start_at ? { start_at: start_at.toISOString() } : {}),
        ...(end_at ? { end_at: end_at.toISOString() } : {}),
      },
    },
  })

  res.json({ auction: toVendorAuction(result) })
}
