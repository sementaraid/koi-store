import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MODERATION_MODULE } from "../../modules/moderation"
import type ModerationModuleService from "../../modules/moderation/service"
import type {
  ClaimRemedy,
  ClaimStatus,
} from "../../modules/moderation/models/claim"
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

export type GetDecidableClaimInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  claim_id: string
}

export type DecidableClaim = { id: string }

// US-055 T-055.1a (AC1, D-038, D-054): read-only guard, run under the
// `claim:<id>` lock. Another farm's claim and an unknown claim are the same
// 404 (no existence leak); any status but `open` is a 409, so a repeat of the
// same decision and the wrong decision are both refused.
export const getDecidableClaimStep = createStep(
  "get-decidable-claim",
  async (input: GetDecidableClaimInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "seller_id", "status"],
      filters: { id: input.claim_id },
    })
    if (!claim || claim.seller_id !== input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
    }
    if (claim.status !== "open") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Klaim ini sudah diputuskan.",
        "claim_already_decided"
      )
    }
    return new StepResponse<DecidableClaim>({ id: claim.id })
  }
)

export type DecideClaimStepInput = {
  claim_id: string
  status: "approved" | "disputed"
}

// US-055 T-055.1a: the farmer's decision, one mutation. Both timestamps are
// the server's clock, set here and not in the route (CLAUDE.md §8).
// `approved_at` is set only on accept; on dispute it stays null. Compensation
// restores exactly the three fields this step changes, so a later failure
// leaves the claim `open` again.
export const decideClaimStep = createStep(
  "decide-claim",
  async (input: DecideClaimStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const previous = await service.retrieveClaim(input.claim_id)
    const now = new Date()
    const [updated] = await service.updateClaims([
      {
        id: input.claim_id,
        status: input.status,
        farmer_decided_at: now,
        ...(input.status === "approved" ? { approved_at: now } : {}),
      },
    ])
    return new StepResponse(updated, {
      id: input.claim_id,
      previous: {
        status: previous.status,
        approved_at: previous.approved_at,
        farmer_decided_at: previous.farmer_decided_at,
      },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: {
            status: ClaimStatus
            approved_at: Date | null
            farmer_decided_at: Date | null
          }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.updateClaims([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)

export type GetAdminDecidableClaimInput = {
  claim_id: string
}

// US-055 T-055.1b (AC2, D-038, D-055): read-only guard for the admin decision,
// run under the `claim:<id>` lock. Only `disputed` is decidable; every other
// status is a 409, which also makes the decision final (a second approve or
// reject is refused). An unknown claim is 404.
export const getAdminDecidableClaimStep = createStep(
  "get-admin-decidable-claim",
  async (input: GetAdminDecidableClaimInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "status"],
      filters: { id: input.claim_id },
    })
    if (!claim) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
    }
    if (claim.status !== "disputed") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Klaim ini tidak sedang disengketakan.",
        "claim_not_disputed"
      )
    }
    return new StepResponse<DecidableClaim>({ id: claim.id })
  }
)

export type DecideClaimAsAdminStepInput = {
  claim_id: string
  status: "approved" | "rejected"
  // From req.auth_context.actor_id, never the body.
  decided_by: string
  reason: string
}

// US-055 T-055.1b (AC2, D-038, D-055): the admin's decision, one mutation.
// `approved_at` is set only on approve, and always from the server's clock
// (CLAUDE.md §8). Compensation restores exactly the fields this step changes,
// so a later failure leaves the claim `disputed` with its previous decision
// columns intact.
export const decideClaimAsAdminStep = createStep(
  "decide-claim-as-admin",
  async (input: DecideClaimAsAdminStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const previous = await service.retrieveClaim(input.claim_id)
    const now = new Date()
    const [updated] = await service.updateClaims([
      {
        id: input.claim_id,
        status: input.status,
        ...(input.status === "approved" ? { approved_at: now } : {}),
        decided_by: input.decided_by,
        decided_at: now,
        decision_reason: input.reason,
      },
    ])
    return new StepResponse(updated, {
      id: input.claim_id,
      previous: {
        status: previous.status,
        approved_at: previous.approved_at,
        decided_by: previous.decided_by,
        decided_at: previous.decided_at,
        decision_reason: previous.decision_reason,
      },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: {
            status: ClaimStatus
            approved_at: Date | null
            decided_by: string | null
            decided_at: Date | null
            decision_reason: string | null
          }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.updateClaims([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)

// US-056 (AC1, D-027, D-038): the winner has 3 days from `resolved_at` to
// confirm; T-056.1b's job and admin-koi's flag both mirror this number. One
// constant, no env var.
export const CLAIM_CONFIRM_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

export type GetResolvableClaimInput = {
  // From req.seller_context, never the body (D-003).
  seller_id: string
  claim_id: string
}

// US-056 (AC1, D-038, D-055): read-only guard, run under the `claim:<id>`
// lock. Another farm's claim and an unknown claim are the same 404 (no
// existence leak); any status but `approved` is a 409, so a repeat and a
// resolution of an undecided/closed claim are both refused.
export const getResolvableClaimStep = createStep(
  "get-resolvable-claim",
  async (input: GetResolvableClaimInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "seller_id", "status"],
      filters: { id: input.claim_id },
    })
    if (!claim || claim.seller_id !== input.seller_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
    }
    if (claim.status !== "approved") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Klaim ini belum disetujui.",
        "claim_not_approved"
      )
    }
    return new StepResponse<DecidableClaim>({ id: claim.id })
  }
)

export type ResolveClaimStepInput = { claim_id: string }

// US-056 (AC1, D-058): `approved → resolved`, one mutation. The timestamp is
// the server's clock, set here and not in the route (CLAUDE.md §8). No money
// moves: an off-platform refund is the farmer paying the winner directly.
// Compensation restores exactly `status` and `resolved_at`.
export const resolveClaimStep = createStep(
  "resolve-claim",
  async (input: ResolveClaimStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const previous = await service.retrieveClaim(input.claim_id)
    const now = new Date()
    const [updated] = await service.updateClaims([
      { id: input.claim_id, status: "resolved", resolved_at: now },
    ])
    return new StepResponse(updated, {
      id: input.claim_id,
      previous: { status: previous.status, resolved_at: previous.resolved_at },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: { status: ClaimStatus; resolved_at: Date | null }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.updateClaims([
      { id: compensation.id, ...compensation.previous },
    ])
  }
)

export type GetConfirmableClaimInput = {
  claim_id: string
  // The winner's customer id. Omitted by T-056.1b's job, which confirms on
  // the 3-day deadline rather than on a caller.
  winner_customer_id?: string
}

// US-056 (AC1, D-038, D-055): read-only guard, run under the `claim:<id>`
// lock. An unknown claim, a claim of another customer and a claim with no
// winner id to match are the same 404 (no existence leak); only `resolved` is
// confirmable, everything else is a 409.
export const getConfirmableClaimStep = createStep(
  "get-confirmable-claim",
  async (input: GetConfirmableClaimInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [claim],
    } = await query.graph({
      entity: "claim",
      fields: ["id", "customer_id", "status"],
      filters: { id: input.claim_id },
    })
    if (
      !claim ||
      (input.winner_customer_id !== undefined &&
        claim.customer_id !== input.winner_customer_id)
    ) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
    }
    if (claim.status !== "resolved") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        "Klaim ini belum ditandai selesai.",
        "claim_not_resolved"
      )
    }
    return new StepResponse<DecidableClaim>({ id: claim.id })
  }
)

export type ConfirmClaimStepInput = { claim_id: string }

// US-056 (AC1, D-058): `resolved → confirmed`, one mutation, server clock.
// Compensation restores exactly `status` and `confirmed_at`.
export const confirmClaimStep = createStep(
  "confirm-claim",
  async (input: ConfirmClaimStepInput, { container }) => {
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    const previous = await service.retrieveClaim(input.claim_id)
    const now = new Date()
    const [updated] = await service.updateClaims([
      { id: input.claim_id, status: "confirmed", confirmed_at: now },
    ])
    return new StepResponse(updated, {
      id: input.claim_id,
      previous: { status: previous.status, confirmed_at: previous.confirmed_at },
    })
  },
  async (
    compensation:
      | {
          id: string
          previous: { status: ClaimStatus; confirmed_at: Date | null }
        }
      | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<ModerationModuleService>(MODERATION_MODULE)
    await service.updateClaims([
      { id: compensation.id, ...compensation.previous },
    ])
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
