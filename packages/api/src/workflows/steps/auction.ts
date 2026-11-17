import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import type { AuctionDTO, LotDTO } from "../../modules/auction/service"
import { AUCTION_MODULE } from "../../modules/auction"
import type AuctionModuleService from "../../modules/auction/service"
import { PLATFORM_SETTING_DEFAULTS } from "../../modules/platform-settings/defaults"

const auctionService = (container: { resolve: <T>(key: string) => T }) =>
  container.resolve<AuctionModuleService>(AUCTION_MODULE)

export type AuctionSettings = {
  extend_window_minutes: number
  max_lots_per_auction: number
  auction_min_days: number
  auction_max_days: number
}

// US-015/US-030: the limits and the extend window in force right now. Read
// only (no row is created); defaults apply until an admin saves settings.
export const getAuctionSettingsStep = createStep(
  "get-auction-settings",
  async (_: void, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [row],
    } = await query.graph({
      entity: "platform_setting",
      fields: [
        "extend_window_minutes",
        "max_lots_per_auction",
        "auction_min_days",
        "auction_max_days",
      ],
      pagination: { take: 1 },
    })

    const settings: AuctionSettings = {
      extend_window_minutes:
        row?.extend_window_minutes ??
        PLATFORM_SETTING_DEFAULTS.extend_window_minutes,
      max_lots_per_auction:
        row?.max_lots_per_auction ??
        PLATFORM_SETTING_DEFAULTS.max_lots_per_auction,
      auction_min_days:
        row?.auction_min_days ?? PLATFORM_SETTING_DEFAULTS.auction_min_days,
      auction_max_days:
        row?.auction_max_days ?? PLATFORM_SETTING_DEFAULTS.auction_max_days,
    }
    return new StepResponse(settings)
  }
)

export type FeeCategoryFees = {
  fee_category_id: string
  listing_fee: number
  join_fee: number
}

// The fee table row the farmer picked. Read through Query (cross-module read),
// never a service call.
export const getFeeCategoryFeesStep = createStep(
  "get-fee-category-fees",
  async (input: { fee_category_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [category],
    } = await query.graph({
      entity: "fee_category",
      fields: ["id", "listing_fee", "join_fee"],
      filters: { id: input.fee_category_id },
    })

    if (!category) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "fee_category_id does not match a category in the fee table"
      )
    }

    const fees: FeeCategoryFees = {
      fee_category_id: category.id,
      listing_fee: category.listing_fee,
      join_fee: category.join_fee,
    }
    return new StepResponse(fees)
  }
)

const DAY_MS = 24 * 60 * 60 * 1000

// Times cross steps as epoch milliseconds: step data is serialized between
// steps, so a Date comes out as a string. The step builds the Date itself.
export type ValidateNewAuctionStepInput = {
  settings: AuctionSettings
  start_ms: number
  end_ms: number
  lot_count: number
}

// US-015 limits on the server, not only in the form (T-030.4): auction length
// between auction_min_days and auction_max_days, up to max_lots_per_auction
// lots, end after start. Read-only.
export const validateNewAuctionStep = createStep(
  "validate-new-auction",
  async (input: ValidateNewAuctionStepInput) => {
    const { settings, start_ms, end_ms, lot_count } = input
    const days = (end_ms - start_ms) / DAY_MS

    if (!(end_ms > start_ms)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Waktu selesai harus setelah waktu mulai."
      )
    }
    if (days < settings.auction_min_days || days > settings.auction_max_days) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Lelang harus berlangsung ${settings.auction_min_days}-${settings.auction_max_days} hari.`
      )
    }
    if (lot_count > settings.max_lots_per_auction) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Maksimal ${settings.max_lots_per_auction} lot per lelang.`
      )
    }

    return new StepResponse(void 0)
  }
)

// Same limits when an auction is edited while draft (AC1, AC8). Read-only.
export const validateAuctionUpdateStep = createStep(
  "validate-auction-update",
  async (input: {
    settings: AuctionSettings
    start_ms: number
    end_ms: number
  }) => {
    const days = (input.end_ms - input.start_ms) / DAY_MS
    if (!(input.end_ms > input.start_ms)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Waktu selesai harus setelah waktu mulai."
      )
    }
    if (
      days < input.settings.auction_min_days ||
      days > input.settings.auction_max_days
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Lelang harus berlangsung ${input.settings.auction_min_days}-${input.settings.auction_max_days} hari.`
      )
    }

    return new StepResponse(void 0)
  }
)

export type CreateAuctionStepInput = {
  seller_id: string
  fee_category_id: string
  start_ms: number
  end_ms: number
  delivery_method: AuctionDTO["delivery_method"]
  listing_fee: number
  join_fee: number
  extend_window_minutes: number
}

// Single mutation: the auction row, always as `draft` (AC8, D-031).
export const createAuctionStep = createStep(
  "create-auction",
  async (input: CreateAuctionStepInput, { container }) => {
    const { start_ms, end_ms, ...rest } = input
    const [auction] = await auctionService(container).createAuctions([
      {
        ...rest,
        start_at: new Date(start_ms),
        end_at: new Date(end_ms),
        status: "draft",
      },
    ])
    return new StepResponse(auction, auction.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await auctionService(container).deleteAuctions([id])
  }
)

export type CreateLotsStepInput = {
  auction_id: string
  lots: {
    product_id: string
    ob: number
    kb: number
    end_ms: number
  }[]
}

// Single mutation: the lot rows. `current_price` starts at OB and the lot is
// `open` (plan.md "Pricing per lot", "Design rules").
export const createLotsStep = createStep(
  "create-lots",
  async (input: CreateLotsStepInput, { container }) => {
    const created = await auctionService(container).createLots(
      input.lots.map((lot) => ({
        auction_id: input.auction_id,
        product_id: lot.product_id,
        ob: lot.ob,
        kb: lot.kb,
        current_price: lot.ob,
        end_time: new Date(lot.end_ms),
        status: "open" as const,
      }))
    )
    return new StepResponse(
      created,
      created.map((lot: LotDTO) => lot.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    await auctionService(container).deleteLots(ids)
  }
)

export type SalesAuction = {
  id: string
  seller_id: string
  fee_category_id: string
  status: AuctionDTO["status"]
  start_ms: number
  end_ms: number
  delivery_method: AuctionDTO["delivery_method"]
}

// Read-only guard for the draft-edit workflow: the auction exists, belongs to
// the acting seller and is still editable (D-031).
export const getDraftAuctionStep = createStep(
  "get-draft-auction",
  async (input: { auction_id: string; seller_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: [
        "id",
        "seller_id",
        "fee_category_id",
        "status",
        "start_at",
        "end_at",
        "delivery_method",
      ],
      filters: { id: input.auction_id },
    })

    // Not-found is reported for another seller's auction too, so ids can't be
    // probed.
    if (!auction || auction.seller_id !== input.seller_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Auction ${input.auction_id} was not found`
      )
    }
    if (auction.status !== "draft") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        `Auction ${input.auction_id} can only be edited while it is draft`
      )
    }

    const draft: SalesAuction = {
      id: auction.id,
      seller_id: auction.seller_id,
      fee_category_id: auction.fee_category_id,
      status: auction.status,
      start_ms: new Date(auction.start_at).getTime(),
      end_ms: new Date(auction.end_at).getTime(),
      delivery_method: auction.delivery_method,
    }
    return new StepResponse(draft)
  }
)

export type PendingAuction = {
  id: string
  listing_fee: number
  join_fee: number
  payer_customer_id: string | null
}

// Read-only guard for approve and reject (US-032, D-031): only a
// `pending_approval` auction is in the admin queue. Run under the workflow's
// per-auction lock so two decisions can't both pass. `refuse_started` (approve
// only, mvp-Q31 option b): a start_at at or before the server's now is refused
// with `start_passed`; reject stays allowed so the farmer can resubmit.
export const getPendingAuctionStep = createStep(
  "get-pending-auction",
  async (
    input: { auction_id: string; refuse_started?: boolean },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [auction],
    } = await query.graph({
      entity: "auction",
      fields: [
        "id",
        "status",
        "start_at",
        "listing_fee",
        "join_fee",
        "payer_customer_id",
      ],
      filters: { id: input.auction_id },
    })

    if (!auction) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Auction ${input.auction_id} was not found`
      )
    }
    if (auction.status !== "pending_approval") {
      throw new MedusaError(
        MedusaError.Types.CONFLICT,
        `Auction ${input.auction_id} is not pending approval`
      )
    }
    if (
      input.refuse_started &&
      new Date(auction.start_at).getTime() <= Date.now()
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This auction's start time has already passed. Reject it so the farmer can resubmit with new dates.",
        "start_passed"
      )
    }

    const pending: PendingAuction = {
      id: auction.id,
      listing_fee: auction.listing_fee,
      join_fee: auction.join_fee,
      payer_customer_id: auction.payer_customer_id ?? null,
    }
    return new StepResponse(pending)
  }
)

export type AuctionFields = Partial<
  Pick<
    AuctionDTO,
    | "status"
    | "listing_fee"
    | "join_fee"
    | "payer_customer_id"
    | "fee_override_listing_fee"
    | "fee_override_join_fee"
    | "fee_override_reason"
    | "rejection_reason"
  >
>

// Single mutation: the submit/approve/reject transition and the fields that go
// with it (US-031, US-032). Callers check the current status first under the
// per-auction lock. Compensation restores exactly the fields this step changed.
export const setAuctionFieldsStep = createStep(
  "set-auction-fields",
  async (input: { id: string; update: AuctionFields }, { container }) => {
    const service = auctionService(container)
    const previous = await service.retrieveAuction(input.id)
    const [updated] = await service.updateAuctions([
      { id: input.id, ...input.update },
    ])
    const restore = Object.fromEntries(
      Object.keys(input.update).map((key) => [
        key,
        previous[key as keyof AuctionFields],
      ])
    ) as AuctionFields
    return new StepResponse(updated, { id: input.id, restore })
  },
  async (
    compensation: { id: string; restore: AuctionFields } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    await auctionService(container).updateAuctions([
      { id: compensation.id, ...compensation.restore },
    ])
  }
)

// Single mutation: soft-delete one lot of a draft (D-032: the lot count may
// change after a rejection). The lot must belong to the auction, and the last
// lot can't go (an auction has at least one, US-030). Compensation restores it.
// ponytail: the lot's draft Mercur product stays (unpublished, unreferenced);
// delete it through Mercur's product-edit flow if orphans ever matter.
export const removeDraftLotStep = createStep(
  "remove-draft-lot",
  async (input: { auction_id: string; lot_id: string }, { container }) => {
    const service = auctionService(container)
    const lots = await service.listLots(
      { auction_id: input.auction_id },
      { select: ["id"] }
    )
    if (!lots.some((lot) => lot.id === input.lot_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Lot ${input.lot_id} was not found on auction ${input.auction_id}`
      )
    }
    if (lots.length <= 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "An auction needs at least one lot"
      )
    }
    await service.softDeleteLots([input.lot_id])
    return new StepResponse(input.lot_id, input.lot_id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await auctionService(container).restoreLots([id])
  }
)

export type UpdateDraftAuctionFields = {
  fee_category_id?: string
  start_ms?: number
  end_ms?: number
  delivery_method?: AuctionDTO["delivery_method"]
}

export type UpdateDraftAuctionStepInput = {
  id: string
  update: UpdateDraftAuctionFields
}

// Single mutation: the editable auction fields. Compensation restores exactly
// the fields this step changed. Fees and the extend window are snapshots taken
// at creation (AC6, AC7); they are not touched here.
export const updateDraftAuctionStep = createStep(
  "update-draft-auction",
  async (input: UpdateDraftAuctionStepInput, { container }) => {
    const { start_ms, end_ms, ...rest } = input.update
    const update = {
      ...rest,
      ...(start_ms !== undefined ? { start_at: new Date(start_ms) } : {}),
      ...(end_ms !== undefined ? { end_at: new Date(end_ms) } : {}),
    }
    const previous = await auctionService(container).retrieveAuction(input.id)
    const [updated] = await auctionService(container).updateAuctions([
      { id: input.id, ...update },
    ])

    // Compensation restores exactly the fields this step changed, in the same
    // shape this step took them.
    const restore: UpdateDraftAuctionFields = {}
    if (update.fee_category_id !== undefined) {
      restore.fee_category_id = previous.fee_category_id
    }
    if (update.delivery_method !== undefined) {
      restore.delivery_method = previous.delivery_method
    }
    if (start_ms !== undefined) {
      restore.start_ms = new Date(previous.start_at).getTime()
    }
    if (end_ms !== undefined) {
      restore.end_ms = new Date(previous.end_at).getTime()
    }

    return new StepResponse(updated, { id: input.id, restore })
  },
  async (
    compensation: { id: string; restore: UpdateDraftAuctionFields } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    const { start_ms, end_ms, ...rest } = compensation.restore
    await auctionService(container).updateAuctions([
      {
        id: compensation.id,
        ...rest,
        ...(start_ms !== undefined ? { start_at: new Date(start_ms) } : {}),
        ...(end_ms !== undefined ? { end_at: new Date(end_ms) } : {}),
      },
    ])
  }
)

// T-030.8: single mutation, every lot of the auction gets the auction's new
// end_at as its end_time (a lot closes on its own end_time, US-050).
// Compensation restores each lot's previous end_time.
export const setLotsEndTimeStep = createStep(
  "set-lots-end-time",
  async (input: { auction_id: string; end_ms: number }, { container }) => {
    const service = auctionService(container)
    const lots = await service.listLots(
      { auction_id: input.auction_id },
      { select: ["id", "end_time"] }
    )
    await service.updateLots(
      lots.map((lot) => ({ id: lot.id, end_time: new Date(input.end_ms) }))
    )
    return new StepResponse(
      void 0,
      lots.map((lot) => ({ id: lot.id, end_ms: new Date(lot.end_time).getTime() }))
    )
  },
  async (
    previous: { id: string; end_ms: number }[] | undefined,
    { container }
  ) => {
    if (!previous?.length) {
      return
    }
    await auctionService(container).updateLots(
      previous.map((lot) => ({ id: lot.id, end_time: new Date(lot.end_ms) }))
    )
  }
)
