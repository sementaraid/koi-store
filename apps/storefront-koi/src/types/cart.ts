import type { ComponentProps } from "react"

import type {
  Product,
  SimpleProduct,
} from "@/types/product"
import type { CountdownTarget } from "@/hooks/use-countdown"

export type CartLine = {
  product: Product
  quantity?: number
  dueAt?: CountdownTarget
}

export type CartMoney = {
  items: number
  shipping?: number
  tax?: number
  discount?: number
  total: number
  currency: string
}

export type CheckoutStep = "cart" | "shipping" | "payment"

export type CartPageProps = ComponentProps<"div"> &
  {
    lines?: CartLine[]
    money?: CartMoney
    step?: CheckoutStep
    onQuantityChange?: (product: SimpleProduct, quantity: number) => void
    onRemove?: (product: Product) => void
    onCheckout?: () => void
  }
