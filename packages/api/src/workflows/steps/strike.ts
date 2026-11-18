import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { MedusaContainer, RemoteQueryFunction } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MODERATION_MODULE } from "../../modules/moderation"
import type ModerationModuleService from "../../modules/moderation/service"
import type { StrikeReasonType } from "../../modules/moderation/models/strike"
import {
  readActiveStrikeCounts,
  readSellerCustomerIds,
  type StrikeCount,
} from "../../utils/strike"

type Query = Omit<RemoteQueryFunction, symbol>

export type StrikeSubjectInput = {
  customer_id?: string
  seller_id?: string
  lot_id?: string
}

export type StrikeSubject = {
  customer_id: string
  seller_id: string | null
  lot_id: string | null
}

// US-059 (AC1, D-003): the strike's subject, resolved from the account id the
// admin gave, else the farm's member email, else the lot's winner. Read only,
// so no compensation. Missing → 404 in Indonesian (D-055).
export const resolveStrikeSubjectStep = createStep(
  "resolve-strike-subject",
  async (input: StrikeSubjectInput, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const notFound = () =>
      new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Akun pemilik kebun tidak ditemukan."
      )

    if (input.customer_id) {
      const {
        data: [customer],
      } = await query.graph({
        entity: "customer",
        fields: ["id"],
        filters: { id: input.customer_id },
      })
      if (!customer) throw notFound()
      return new StepResponse<StrikeSubject>({
        customer_id: customer.id,
        seller_id: null,
        lot_id: null,
      })
    }

    if (input.seller_id) {
      const bySeller = await readSellerCustomerIds(container, query, [
        input.seller_id,
      ])
      const customerId = bySeller.get(input.seller_id)
      if (!customerId) throw notFound()
      return new StepResponse<StrikeSubject>({
        customer_id: customerId,
        seller_id: input.seller_id,
        lot_id: null,
      })
    }

    if (input.lot_id) {
      const {
        data: [lot],
      } = await query.graph({
        entity: "lot",
        fields: ["id", "winner_customer_id"],
        filters: { id: input.lot_id },
      })
      if (!lot?.winner_customer_id) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
      }
      return new StepResponse<StrikeSubject>({
        customer_id: lot.winner_customer_id as string,
        seller_id: null,
        lot_id: lot.id as string,
      })
    }

    throw notFound()
  }
)

// Member email → the customer on the same auth identity (D-003), the
// farm queue's own lookup. Used by the strike subject resolution below.

export type CreateStrikeStepInput = {
  customer_id: string
  seller_id: string | null
  lot_id: string | null
  reason_type: StrikeReasonType
  reason: string
  // req.auth_context.actor_id, never the body.
  created_by: string
}

// Single mutation: insert one strike (AC1). Nothing else is written, no money
// moves (D-058). Compensation deletes the row.
export const createStrikeStep = createStep(
  "create-strike",
  async (input: CreateStrikeStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const [strike] = await service.createStrikes([input])
    return new StepResponse(strike, strike.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) return
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.deleteStrikes([id])
  }
)

// Read only. 404 an unknown strike or one already removed (AC3).
export const getStrikeForRemovalStep = createStep(
  "get-strike-for-removal",
  async (input: { strike_id: string }, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const {
      data: [strike],
    } = await query.graph({
      entity: "strike",
      fields: ["id", "customer_id", "removed_at"],
      filters: { id: input.strike_id },
    })
    if (!strike || strike.removed_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Strike tidak ditemukan."
      )
    }
    return new StepResponse<{ id: string; customer_id: string }>({
      id: strike.id as string,
      customer_id: strike.customer_id as string,
    })
  }
)

export type RemoveStrikeStepInput = {
  strike_id: string
  removed_by: string
  removed_reason: string
}

// US-059 (AC3, D-041): removing writes three columns, never deletes. It
// re-reads under the workflow's lock, so a second removal is a 404.
// Compensation restores exactly the three previous values.
export const removeStrikeStep = createStep(
  "remove-strike",
  async (input: RemoveStrikeStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const previous = await service.retrieveStrike(input.strike_id)
    if (previous.removed_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Strike tidak ditemukan."
      )
    }
    const [updated] = await service.updateStrikes([
      {
        id: input.strike_id,
        removed_at: new Date(),
        removed_by: input.removed_by,
        removed_reason: input.removed_reason,
      },
    ])
    return new StepResponse(updated, {
      id: input.strike_id,
      previous: {
        removed_at: previous.removed_at,
        removed_by: previous.removed_by,
        removed_reason: previous.removed_reason,
      },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: {
            removed_at: Date | null
            removed_by: string | null
            removed_reason: string | null
          }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) return
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.updateStrikes([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)

// US-059 (AC2): one batched read for the customer; the ban is derived.
export const getActiveStrikeCountStep = createStep(
  "get-active-strike-count",
  async (input: { customer_id: string }, { container }) => {
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const counts = await readActiveStrikeCounts(query, [input.customer_id])
    return new StepResponse<StrikeCount>(
      counts.get(input.customer_id) ?? { active_count: 0, banned: false }
    )
  }
)
