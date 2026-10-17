import { ShoppingCart } from "lucide-react"

import { Link } from "@/components/koi/link"
import { ROUTES } from "@/components/constant/routes"
import { RenderIf } from "@/components/module/render-if"
import type { HeaderCart } from "@/components/types/header"

/**
 * The cart, on the bar: a bag, and how many items are behind it.
 *
 * @remarks
 * A glyph rather than the word, because the bar already carries a word per
 * destination and the cart is the one control here whose meaning is not in
 * doubt — a shopping bag beside a search field and a bell is not a thing anyone
 * reads twice. The name is kept in the accessible name rather than on screen: a
 * sighted visitor reads the bag, a screen reader hears `"Keranjang"`.
 *
 * The count is a pill rather than a dot, because the number is the useful part —
 * "3" tells a visitor whether they have added what they meant to, where a dot
 * only tells them the cart is not empty. It only appears above zero: a `0` badge
 * claims every page checked the cart and found it empty.
 *
 * Hidden below `lg`, where the bar is already carrying a back control, a search
 * field and the bell: the cart is one tap away in the bottom nav, and a fifth
 * control on a phone's bar would squeeze out the search field.
 */
export function CartLink({ href = ROUTES.cart, count }: HeaderCart) {
  return (
    <Link
      href={href}
      data-slot="header-cart"
      aria-label="Keranjang"
      className="relative hidden items-center text-foreground outline-none hover:text-accent-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:flex"
    >
      <ShoppingCart aria-hidden className="size-5" />
      <RenderIf when={count}>
        {(value) => (
          <span className="absolute -end-1.5 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-2xs font-bold text-primary-foreground tabular-nums">
            {value}
          </span>
        )}
      </RenderIf>
    </Link>
  )
}
