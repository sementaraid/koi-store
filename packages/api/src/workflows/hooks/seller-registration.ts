import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { MercurModules, SellerStatus } from "@mercurjs/types"
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

// AC3 (D-015): a rejected registration is final. Rejection is Mercur's
// suspend, so a rejected seller is `suspended` with `approved_at` null; a
// seller suspended after approval keeps `approved_at`, and a pending
// registration is not suspended at all. Only the first case is refused.
const assertNoRejectedRegistration = async (
  query: QueryGraph,
  memberId: string
) => {
  const { data: links } = await query.graph({
    entity: "seller_member",
    fields: ["seller.id", "seller.status", "seller.approved_at"],
    filters: { member_id: memberId },
  })

  const rejected = links.some((link) => {
    const seller = link.seller as
      | { status?: string; approved_at?: unknown }
      | undefined
    return seller?.status === SellerStatus.SUSPENDED && !seller.approved_at
  })

  if (rejected) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Penolakan bersifat final. Pendaftaran tidak dapat diajukan ulang dengan akun ini."
    )
  }
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
    const query = container.resolve<QueryGraph>(ContainerRegistrationKeys.QUERY)
    const memberEmail = input.member_email
    let emailpassEmail: string | undefined
    if (memberEmail) {
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
      emailpassEmail = identities.find(
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

    // US-021 AC3 (D-015): the same member cannot register a second farm after
    // a rejection, not even with a different seller email. `member_id` is the
    // caller's own member, but a member token taken before the first
    // registration has an empty `actor_id` (D-003/D-030) even though that
    // registration already created the member, so fall back to the identity's
    // own email — already proven to match `member_email` above.
    let memberId = input.member_id as string | undefined
    const lookupEmail = emailpassEmail ?? memberEmail
    if (!memberId && lookupEmail) {
      const {
        data: [member],
      } = await query.graph({
        entity: "member",
        fields: ["id"],
        filters: { email: lookupEmail },
      })
      memberId = member?.id as string | undefined
    }
    if (memberId) {
      await assertNoRejectedRegistration(query, memberId)
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
