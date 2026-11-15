import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { MercurModules } from "@mercurjs/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  assertFarmRegistrationFields,
  FarmRegistrationAdditionalData,
} from "../../api/utils/farm-registration"

// US-020 hooks on Mercur's `createSellerAccountWorkflow` (the flow behind
// POST /vendor/sellers). Custom-fields docs: the route carries farm data in
// `additional_data`, the hook persists it. Extend the workflow, don't fork it.

type QueryGraph = {
  graph(input: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }): Promise<{ data: Record<string, unknown>[] }>
}

type ProviderIdentity = { provider: string; entity_id: string }

// Only the two methods used here. `@mercurjs/types` ships no service type for
// the custom-fields module.
type CustomFieldsService = {
  upsert(
    alias: string,
    data: { id: string } & Record<string, unknown>
  ): Promise<unknown>
  delete(alias: string, ids: string[]): Promise<void>
}

const farmFieldsFrom = (
  additional_data: Record<string, unknown> | undefined
): FarmRegistrationAdditionalData | undefined => {
  if (!additional_data) {
    return undefined
  }
  return {
    ktp_photo_key: additional_data.ktp_photo_key as string,
    ktp_nik: additional_data.ktp_nik as string,
    farm_photo_urls: additional_data.farm_photo_urls as string[],
  }
}

// T-020.7 (AC6) and T-020.1 (AC1). Runs before the seller is created, so a
// rejected registration writes nothing.
createSellerAccountWorkflow.hooks.validate(
  async ({ input }, { container }) => {
    const memberEmail = input.member_email
    if (memberEmail) {
      const query = container.resolve<QueryGraph>(
        ContainerRegistrationKeys.QUERY
      )
      const {
        data: [identity],
      } = await query.graph({
        entity: "auth_identity",
        fields: [
          "id",
          "provider_identities.provider",
          "provider_identities.entity_id",
        ],
        filters: { id: input.auth_identity_id },
      })

      const identities = (identity?.provider_identities ??
        []) as ProviderIdentity[]
      const emailpassEmail = identities.find(
        (pi) => pi.provider === "emailpass"
      )?.entity_id

      if (
        !emailpassEmail ||
        emailpassEmail.toLowerCase() !== memberEmail.toLowerCase()
      ) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "member_email must be the email you are signed in with."
        )
      }
    }

    // Every route to this workflow that carries farm data is a farm
    // registration, and must satisfy AC1. Callers without `additional_data`
    // (the seed scripts) are not registrations; the HTTP route always requires
    // it (see copyCustomerPhoneToSeller).
    if (input.additional_data) {
      assertFarmRegistrationFields(input as Parameters<typeof assertFarmRegistrationFields>[0])
    }
  }
)

// T-020.1: persist the farm Custom Fields onto the new seller. The upsert is
// one mutation; compensation removes the row if a later step fails.
createSellerAccountWorkflow.hooks.sellerAccountCreated(
  async ({ seller, additional_data }, { container }) => {
    const farm = farmFieldsFrom(additional_data)
    if (!farm) {
      return
    }

    const customFields = container.resolve<CustomFieldsService>(
      MercurModules.CUSTOM_FIELDS
    )
    await customFields.upsert("seller", { id: seller.id, ...farm })
    return new StepResponse(undefined, seller.id)
  },
  async (sellerId: string | undefined, { container }) => {
    if (!sellerId) {
      return
    }
    const customFields = container.resolve<CustomFieldsService>(
      MercurModules.CUSTOM_FIELDS
    )
    await customFields.delete("seller", [sellerId])
  }
)
