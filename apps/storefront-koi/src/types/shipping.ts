import type { ComponentProps } from "react"

import type { CartLine, CheckoutStep } from "@/types/cart"
import type { Settlement } from "@/lib/helpers/cart-totals"

export type ShippingOption = {
  id: string
  title: string
  detail?: string
  price?: number
  short?: string
}

export type ShippingAddress = {
  id: string
  name: string
  tag?: string
  line: string
}

export type ShippingChoice = {
  optionId?: string
}

export type ShippingParcel = {
  key: string
  seller?: string
  items: CartLine[]
  mode: "live" | "courier"
  options: ShippingOption[]
  choice?: ShippingChoice
}

export type ShippingSelection = {
  key: string
  optionId: string
}

export type ShippingPageProps = ComponentProps<"div"> &
  {
    parcels?: ShippingParcel[]
    addresses?: ShippingAddress[]
    addressId?: string
    dates?: ShippingDate[]
    dateId?: string
    phone?: string
    onPhoneChange?: (phone: string) => void
    onAddressChange?: (address: ShippingAddress) => void
    onDateChange?: (date: ShippingDate) => void
    onChoiceChange?: (selection: ShippingSelection) => void
    totals?: Settlement
    onCheckout?: () => void
    onBack?: () => void
    onAddAddress?: () => void
    step?: CheckoutStep
    completed?: CheckoutStep[]
  }

export type ShippingDate = {
  id: string
  day: string
  date: string
}
