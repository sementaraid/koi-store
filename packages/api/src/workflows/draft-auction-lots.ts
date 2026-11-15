import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  releaseLockStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { ProductStatus } from "@mercurjs/types"
import { validateSellerOpenStep } from "./steps/validate-seller-open"
import {
  createLotsStep,
  getAuctionSettingsStep,
  getDraftAuctionStep,
  removeDraftLotStep,
  validateNewAuctionStep,
} from "./steps/auction"
import type { CreateAuctionLotInput } from "./create-auction"

export type AddDraftLotsWorkflowInput = {
  seller_id: string
  member_id: string
  auction_id: string
  lots: CreateAuctionLotInput[]
}

// US-031 task note (D-032): a rejected auction is a draft again and the farmer
// may change its lot set. Same shape as create-auction: one Mercur product per
// lot, then the lot rows. The US-015 limits apply to the new total. Fees are
// not touched here; submit recomputes them.
export const addDraftLotsWorkflow = createWorkflow(
  "add-draft-lots",
  function (input: AddDraftLotsWorkflowInput) {
    validateSellerOpenStep({ seller_id: input.seller_id })

    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    const draft = getDraftAuctionStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })
    const settings = getAuctionSettingsStep()
    const { data: existing } = useQueryGraphStep({
      entity: "lot",
      fields: ["id"],
      filters: { auction_id: input.auction_id },
    }).config({ name: "add-draft-lots-existing" })

    validateNewAuctionStep(
      transform(
        { input, draft, settings, existing },
        ({ input, draft, settings, existing }) => ({
          settings,
          start_ms: draft.start_ms,
          end_ms: draft.end_ms,
          lot_count: existing.length + input.lots.length,
        })
      )
    )

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
      transform({ input, draft, products }, ({ input, draft, products }) => ({
        auction_id: input.auction_id,
        lots: input.lots.map((lot, index) => ({
          product_id: products[index].id,
          ob: lot.ob,
          kb: lot.kb,
          end_ms: draft.end_ms,
        })),
      }))
    )

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(lots)
  }
)

export type RemoveDraftLotWorkflowInput = {
  seller_id: string
  auction_id: string
  lot_id: string
}

// US-031 task note (D-032): remove one lot from a draft.
export const removeDraftLotWorkflow = createWorkflow(
  "remove-draft-lot",
  function (input: RemoveDraftLotWorkflowInput) {
    validateSellerOpenStep({ seller_id: input.seller_id })

    const lockKey = transform(input, ({ auction_id }) => `auction:${auction_id}`)
    acquireLockStep({ key: lockKey, timeout: 10, ttl: 30 })

    getDraftAuctionStep({
      auction_id: input.auction_id,
      seller_id: input.seller_id,
    })
    const removed = removeDraftLotStep({
      auction_id: input.auction_id,
      lot_id: input.lot_id,
    })

    releaseLockStep({ key: lockKey })

    return new WorkflowResponse(removed)
  }
)
