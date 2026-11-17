import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MODERATION_MODULE } from "../../modules/moderation"
import type ModerationModuleService from "../../modules/moderation/service"
import type { ClaimRemedy } from "../../modules/moderation/models/claim"
import { PLATFORM_SETTING_DEFAULTS } from "../../modules/platform-settings/defaults"

type Query = Omit<RemoteQueryFunction, symbol>

// D-010: the claim window is a platform setting, not an env var. Shared with
// T-054.1b's won-lot read, which needs the same number to compute
// claim_window_ends_at. One row at most; the default applies until an admin
// saves settings.
export const readClaimWindowHours = async (query: Query): Promise<number> => {
  const {
    data: [row],
  } = await query.graph({
    entity: "platform_setting",
    fields: ["claim_window_hours"],
    pagination: { take: 1 },
  })
  return (
    (row?.claim_window_hours as number | undefined) ??
    PLATFORM_SETTING_DEFAULTS.claim_window_hours
  )
}

// Read only. Keeping the settings read in its own step lets T-054.1b reuse the
// helper above in a route without running a workflow.
export const getClaimWindowHoursStep = createStep(
  "get-claim-window-hours",
  async (_: void, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    return new StepResponse(await readClaimWindowHours(query))
  }
)

export type ClaimableLot = { id: string; seller_id: string }

export type GetClaimableLotInput = {
  customer_id: string
  lot_id: string
  window_hours: number
}

// US-054 AC1/AC2 (read only), run under the `lot:<id>` lock: the caller is
// the lot's winner (anyone else 404, no existence leak), the lot is
// `delivered` (409), the 4-hour (or admin-set) window has not passed (409),
// and the lot has no claim yet whatever its status (mvp-Q44 a). Every check
// runs before the upload, so a refused claim writes no file.
export const getClaimableLotStep = createStep(
  "get-claimable-lot",
  async (input: GetClaimableLotInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: [
        "id",
        "status",
        "delivered_at",
        "winner_customer_id",
        "auction.seller_id",
      ],
      filters: { id: input.lot_id },
    })
    if (!lot || lot.winner_customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    const deliveredAt = lot.delivered_at
      ? new Date(lot.delivered_at as string)
      : null
    if (lot.status !== "delivered" || !deliveredAt) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Klaim hanya untuk lot yang sudah diterima.",
        "invalid_lot_status"
      )
    }

    const windowEndsAt =
      deliveredAt.getTime() + input.window_hours * 60 * 60 * 1000
    if (Date.now() > windowEndsAt) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Batas waktu klaim sudah lewat.",
        "claim_window_closed"
      )
    }

    const {
      data: [existing],
    } = await query.graph({
      entity: "claim",
      fields: ["id"],
      filters: { lot_id: input.lot_id },
    })
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Lot ini sudah punya klaim.",
        "claim_exists"
      )
    }

    return new StepResponse<ClaimableLot>({
      id: lot.id,
      seller_id: (lot.auction as { seller_id: string }).seller_id,
    })
  }
)

export type CreateClaimStepInput = {
  lot_id: string
  customer_id: string
  seller_id: string
  remedy: ClaimRemedy
  video_file_key: string
}

// Single mutation: insert one `open` claim (AC4). The unique index on lot_id
// (mvp-Q44 a) is the DB guard against two simultaneous POSTs; a lost race is
// still the friendly 409, not a 500. Compensation deletes the row, and the
// workflow's upload step then removes the private video.
export const createClaimStep = createStep(
  "create-claim",
  async (input: CreateClaimStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const [claim] = await service.createClaims([input]).catch((error) => {
      if ((error as { code?: string }).code === "23505") {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "Lot ini sudah punya klaim.",
          "claim_exists"
        )
      }
      throw error
    })
    return new StepResponse(claim, claim.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.deleteClaims([id])
  }
)
