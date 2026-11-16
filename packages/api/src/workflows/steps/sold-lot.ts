import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { RemoteQueryFunction } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SellerStatus } from "@mercurjs/types"
import { SOLD_LOT_STATUSES } from "../../api/vendor/sold-lots/validators"

type Query = Omit<RemoteQueryFunction, symbol>

export type WinnerAddress = {
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  postal_code: string | null
  city: string | null
  province: string | null
  country_code: string | null
}

// D-054 reading: a terminated farm can do nothing with its lots. Read-only, so
// no compensation. Suspended farms stay allowed: their sold lots still need
// shipping (D-054), so `open` is not required here.
export const assertSellerNotTerminated = async (
  container: { resolve: <T>(key: string) => T },
  seller_id: string
) => {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "status"],
    filters: { id: seller_id },
  })
  if (seller?.status === SellerStatus.TERMINATED) {
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      "Akun kebun ini sudah ditutup.",
      "seller_terminated"
    )
  }
}

export const assertSellerNotTerminatedStep = createStep(
  "assert-seller-not-terminated",
  async (input: { seller_id: string }, { container }) => {
    await assertSellerNotTerminated(container, input.seller_id)
  }
)

export type ReadWinnerAddressStepInput = {
  // From req.seller_context, never the body.
  seller_id: string
  lot_id: string
}

// D-056: the winner's default shipping address (`is_default_shipping = true`;
// Medusa allows at most one). Read at reveal time, never copied onto the lot.
// Another seller's lot, a non-sold lot or a missing lot is 404 with no
// existence leak. `phone` and `company` are never selected (D-052).
export const readWinnerAddressStep = createStep(
  "read-winner-address",
  async (input: ReadWinnerAddressStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [lot],
    } = await query.graph({
      entity: "lot",
      fields: ["id", "status", "winner_customer_id", "auction.seller_id"],
      filters: { id: input.lot_id },
    })
    const sold: readonly string[] = SOLD_LOT_STATUSES
    if (
      !lot ||
      lot.auction?.seller_id !== input.seller_id ||
      !sold.includes(lot.status as string)
    ) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Lot tidak ditemukan.")
    }
    if (!lot.winner_customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Alamat pemenang belum diisi.")
    }

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: [
        "id",
        "addresses.is_default_shipping",
        "addresses.first_name",
        "addresses.last_name",
        "addresses.address_1",
        "addresses.address_2",
        "addresses.postal_code",
        "addresses.city",
        "addresses.province",
        "addresses.country_code",
      ],
      filters: { id: lot.winner_customer_id as string },
    })
    const address = ((customer?.addresses ?? []) as (WinnerAddress & {
      is_default_shipping: boolean
    })[]).find((a) => a.is_default_shipping)
    if (!address) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Alamat pemenang belum diisi.")
    }

    return new StepResponse<WinnerAddress>({
      first_name: address.first_name ?? null,
      last_name: address.last_name ?? null,
      address_1: address.address_1 ?? null,
      address_2: address.address_2 ?? null,
      postal_code: address.postal_code ?? null,
      city: address.city ?? null,
      province: address.province ?? null,
      country_code: address.country_code ?? null,
    })
  }
)
