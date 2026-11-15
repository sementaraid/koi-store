import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { ProductStatus } from "@mercurjs/types"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import {
  createAuctionStep,
  createLotsStep,
  getAuctionSettingsStep,
  getFeeCategoryFeesStep,
  validateNewAuctionStep,
} from "./steps/auction"
import type { AuctionDeliveryMethod } from "../modules/auction/models/auction"

export type CreateAuctionLotInput = {
  title: string
  description?: string
  // Public image URLs; the storefront uploads them through Mercur's
  // POST /vendor/uploads, which stores koi photos publicly.
  photos: string[]
  ob: number
  kb: number
}

export type CreateAuctionWorkflowInput = {
  // From req.seller_context, never the body.
  seller_id: string
  // The acting member, recorded as the product creator.
  member_id: string
  fee_category_id: string
  // ISO strings: step data is serialized between steps, so Dates don't survive
  // the workflow boundary. Converted back inside the steps.
  start_at: string
  end_at: string
  delivery_method: AuctionDeliveryMethod
  lots: CreateAuctionLotInput[]
}

// US-030 T-030.2. Checks the US-015 limits, snapshots the current extend
// window and the category's fees, and creates the auction as `draft` (AC6–AC8).
// First step: the farm must be `open` (AC5, T-021.5).
export const createAuctionWorkflow = createWorkflow(
  "create-auction",
  function (input: CreateAuctionWorkflowInput) {
    validateSellerOpenStep({ seller_id: input.seller_id })

    const settings = getAuctionSettingsStep()
    const fees = getFeeCategoryFeesStep({ fee_category_id: input.fee_category_id })

    validateNewAuctionStep(
      transform({ input, settings }, ({ input, settings }) => ({
        settings,
        start_ms: Date.parse(input.start_at),
        end_ms: Date.parse(input.end_at),
        lot_count: input.lots.length,
      }))
    )

    // D-032: listing fee is per lot; join fee is once per auction.
    const auction = createAuctionStep(
      transform({ input, settings, fees }, ({ input, settings, fees }) => ({
        seller_id: input.seller_id,
        fee_category_id: input.fee_category_id,
        start_ms: Date.parse(input.start_at),
        end_ms: Date.parse(input.end_at),
        delivery_method: input.delivery_method,
        listing_fee: fees.listing_fee * input.lots.length,
        join_fee: fees.join_fee,
        extend_window_minutes: settings.extend_window_minutes,
      }))
    )

    // One Mercur product per lot: it carries the koi's photos and description.
    const products = createProductsWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        created_by: input.member_id,
        products: input.lots.map((lot) => ({
          title: lot.title,
          description: lot.description,
          status: ProductStatus.DRAFT,
          images: lot.photos.map((url) => ({ url })),
          thumbnail: lot.photos[0],
          seller_ids: [input.seller_id],
        })),
      })),
    })

    const lots = createLotsStep(
      transform(
        { input, auction, products },
        ({ input, auction, products }) => ({
          auction_id: auction.id,
          lots: input.lots.map((lot, index) => ({
            product_id: products[index].id,
            ob: lot.ob,
            kb: lot.kb,
            // A lot starts with the auction's end; per-lot extend is US-043.
            end_ms: Date.parse(input.end_at),
          })),
        })
      )
    )

    return new WorkflowResponse({ auction, lots })
  }
)
