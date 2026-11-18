import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MODERATION_MODULE } from "../../modules/moderation"
import type ModerationModuleService from "../../modules/moderation/service"

// mvp-Q48: "once shipped or later". `open`/`unsold`/`won`/`paid`/`cancelled`
// are refused with `lot_not_shipped`.
export const RATEABLE_LOT_STATUSES = ["shipped", "delivered", "claimed"] as const

export type RateableLot = { seller_id: string }

export type GetRateableLotInput = {
  // From req.auth_context.actor_id, never the body.
  customer_id: string
  lot_id: string
}

// US-057 T-057.1 AC1 (read only), run under the `lot:<id>` lock: the caller is
// the lot's winner (anyone else gets 404, no existence leak) and the lot is
// `shipped`, `delivered` or `claimed` (409 otherwise). Returns the farmer the
// winner rates, saved on the row at write time.
export const getRateableLotStep = createStep(
  "get-rateable-lot",
  async (input: GetRateableLotInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "winner_customer_id", "auction.seller_id"],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.winner_customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (
      !(RATEABLE_LOT_STATUSES as readonly string[]).includes(lot.status as string)
    ) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini belum dikirim, jadi belum bisa dinilai.",
        "lot_not_shipped"
      )
    }
    return new StepResponse<RateableLot>({
      seller_id: (lot.auction as { seller_id: string }).seller_id,
    })
  }
)

export type CreateFarmerRatingInput = {
  lot_id: string
  customer_id: string
  seller_id: string
  stars: number
  comment: string | null
}

// US-057 T-057.1 AC1: one insert, one per lot (the unique index is the guard;
// a lost race is still the friendly 409). Compensation deletes the row, so a
// later failure leaves no rating behind. Medusa's db error mapper turns a
// 23505 into an INVALID_DATA "… already exists." before it reaches here, so
// both shapes count (createLotReportStep, steps/lot-report.ts).
export const createFarmerRatingStep = createStep(
  "create-farmer-rating",
  async (input: CreateFarmerRatingInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const [rating] = await service.createFarmerRatings([input]).catch((error) => {
      const code = (error as { code?: string }).code
      const type = (error as { type?: string }).type
      const mapped =
        type === MedusaError.Types.INVALID_DATA &&
        /already exists/.test((error as Error).message)
      if (code === "23505" || mapped) {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "Anda sudah menilai lot ini.",
          "rating_exists"
        )
      }
      throw error
    })
    return new StepResponse(rating, rating.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.deleteFarmerRatings([id])
  }
)
