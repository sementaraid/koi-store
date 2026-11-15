import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createFeeCategoriesStep,
  deleteFeeCategoryStep,
  FeeCategoryInput,
  updateFeeCategoryStep,
  UpdateFeeCategoryStepInput,
} from "./steps/fee-categories"

// US-014 T-014.1: admin CRUD on the fee table. One mutation per workflow.

export const createFeeCategoriesWorkflow = createWorkflow(
  "create-fee-categories",
  function (input: { fee_categories: FeeCategoryInput[] }) {
    return new WorkflowResponse(createFeeCategoriesStep(input.fee_categories))
  }
)

export const updateFeeCategoryWorkflow = createWorkflow(
  "update-fee-category",
  function (input: UpdateFeeCategoryStepInput) {
    return new WorkflowResponse(updateFeeCategoryStep(input))
  }
)

export const deleteFeeCategoryWorkflow = createWorkflow(
  "delete-fee-category",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteFeeCategoryStep(input.id))
  }
)
