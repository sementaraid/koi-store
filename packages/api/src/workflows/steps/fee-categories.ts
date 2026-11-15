import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PLATFORM_SETTINGS_MODULE } from "../../modules/platform-settings"
import type PlatformSettingsModuleService from "../../modules/platform-settings/service"
import type { FeeCategoryDTO } from "../../modules/platform-settings/service"

export type FeeCategoryInput = {
  name: string
  listing_fee: number
  join_fee: number
}

const service = (container: { resolve: <T>(key: string) => T }) =>
  container.resolve<PlatformSettingsModuleService>(PLATFORM_SETTINGS_MODULE)

// Duplicate names are refused by the unique index on fee_category.name (live
// rows), so concurrent creates can't both win.
export const createFeeCategoriesStep = createStep(
  "create-fee-categories",
  async (input: FeeCategoryInput[], { container }) => {
    const created = await service(container).createFeeCategories(input)
    return new StepResponse(
      created,
      created.map((c) => c.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    await service(container).deleteFeeCategories(ids)
  }
)

export type UpdateFeeCategoryStepInput = {
  id: string
  update: Partial<FeeCategoryInput>
}

// Compensation restores exactly the fields this step changed.
export const updateFeeCategoryStep = createStep(
  "update-fee-category",
  async ({ id, update }: UpdateFeeCategoryStepInput, { container }) => {
    const previous = await service(container).retrieveFeeCategory(id)
    const [updated] = await service(container).updateFeeCategories([
      { id, ...update },
    ])
    const restore = Object.fromEntries(
      Object.keys(update).map((key) => [
        key,
        previous[key as keyof FeeCategoryDTO],
      ])
    ) as Partial<FeeCategoryInput>
    return new StepResponse(updated, { id, restore })
  },
  async (
    compensation: { id: string; restore: Partial<FeeCategoryInput> } | undefined,
    { container }
  ) => {
    if (!compensation) {
      return
    }
    await service(container).updateFeeCategories([
      { id: compensation.id, ...compensation.restore },
    ])
  }
)

// Soft delete, so the row can be restored on rollback and auctions created
// before the delete keep a resolvable category (T-014.2).
export const deleteFeeCategoryStep = createStep(
  "delete-fee-category",
  async (id: string, { container }) => {
    await service(container).retrieveFeeCategory(id) // 404 for an unknown id
    await service(container).softDeleteFeeCategories([id])
    return new StepResponse(id, id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }
    await service(container).restoreFeeCategories([id])
  }
)
