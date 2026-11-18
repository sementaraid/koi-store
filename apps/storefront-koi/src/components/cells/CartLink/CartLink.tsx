import { ShoppingCart } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { ROUTES } from "@/const/routes"
import { RenderIf } from "@koi/ui"
import type { HeaderCart } from "@/types/header"

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
