import type { ComponentProps } from "react"
import { cn } from "cn"

import { Button } from "@/components/atoms/Button/Button"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import { AccountCluster } from "@/components/cells/AccountMenu/AccountCluster"
import { BackButton } from "@/components/cells/BackButton/BackButton"
import { BrandMark } from "@/components/cells/BrandMark/BrandMark"
import { CartLink } from "@/components/cells/CartLink/CartLink"
import { DEFAULT_BRAND_ICON, DEFAULT_LINKS } from "@/const/header"
import { NavLinks } from "@/components/cells/NavLinks/NavLinks"
import { SearchField } from "@/components/cells/SearchField/SearchField"
import type {
  HeaderAccount,
  HeaderBack,
  HeaderBrand,
  HeaderCart,
  HeaderLink,
  HeaderSearch,
} from "@/types/header"

export type * from "@/types/header"

/**
 * Props for {@link Header}: the pieces it is built from, plus whatever the
 * caller wants on the element itself.
 *
 * @remarks
 * The slots are the shared types (`HeaderBrand`, `HeaderSearch`, `HeaderBack`)
 * rather than nine loose fields, so the mark, the search box and the back
 * control each declare themselves once — in `types/header.ts` — and the bar
 * composes them. `NavLinks` and `SearchField` take those same types, which is
 * what stops the bar and its parts from disagreeing about a prop name.
 */
export type HeaderProps = ComponentProps<"header"> &
  HeaderBrand &
  HeaderSearch & {
    /** Given, the left slot is a way back instead of the brand mark. */
    back?: HeaderBack
    /** Desktop nav. @defaultValue the default two links */
    links?: HeaderLink[]
    /** Current path, so the matching link takes `aria-current="page"`. */
    activeHref?: string
    /** Signed-in state. Omit and the bar offers sign-in instead. */
    account?: HeaderAccount
    /** The cart door and how much is behind it. Omitted, no cart is shown — a
        page that is not part of a purchase does not have to carry it. */
    cart?: HeaderCart
  }

/**
 * Site header for the Indokoi auction shell.
 *
 * Two faces, switched at `lg`:
 * - **Desktop** — brand mark, nav links, search field, profile dropdown.
 * - **Phone** — back arrow, search field, bell. The nav and the account pages
 *   live in `BottomNav`, which the caller renders; the bar here stays a bar.
 *
 * Presentation only: it does not fetch, route or bid.
 *
 * @remarks
 * Sticky rather than the design's `fixed`, so the caller does not have to offset
 * their own content by the bar height.
 *
 * @example
 * <Header
 *   activeHref="/lelang"
 *   back={{ label: "Katalog", href: "/katalog" }}
 *   account={{ user: { name: "Bpk. Hendra S.", role: "VIP Kolektor" }, unread: 1 }}
 *   onSearch={(q) => navigate(`/katalog?q=${q}`)}
 * />
 */
export function Header({
  brandIcon = DEFAULT_BRAND_ICON,
  brandHref = "/",
  back,
  links = DEFAULT_LINKS,
  activeHref,
  onSearch,
  searchPlaceholder,
  account,
  cart,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-50 w-full bg-card shadow-[0_2px_12px_oklch(0.2_0.03_265/6%)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          CONTAINER,
          "flex h-16 items-center gap-2 lg:h-20 lg:gap-4"
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center gap-2 lg:gap-4">
          {/* Phone: a way back, and nothing else on the left. Desktop: the
              brand mark, with the nav beside it. */}
          <RenderIf when={back}>
            {(value) => <BackButton {...value} className="lg:hidden" />}
          </RenderIf>
          <div className="hidden lg:flex">
            <BrandMark brandIcon={brandIcon} brandHref={brandHref} />
          </div>
          <nav aria-label="Main" className="hidden lg:flex">
            <NavLinks links={links} activeHref={activeHref} />
          </nav>
        </div>

        {/* Search is the one control at every width; on a phone it takes the
            room the nav left behind. */}
        <span className="flex min-w-0 flex-1 justify-end lg:justify-start">
          <SearchField
            onSearch={onSearch}
            searchPlaceholder={searchPlaceholder}
            className="w-64 max-w-full shrink"
          />
        </span>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {/* The cart sits before the account: it belongs to the visit, not to
              the visitor, so it is there signed in or out. */}
          <RenderIf when={cart}>{(value) => <CartLink {...value} />}</RenderIf>

          <RenderIf when={account}>
            {(value) => <AccountCluster account={value} />}
          </RenderIf>
          {/* Signed out: the cluster's two calls to action, standing alone. */}
          <RenderIf when={!account}>
            {() => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={ROUTES.login} />}
                >
                  Masuk
                </Button>
                <Button size="sm" render={<Link href={ROUTES.signup} />}>
                  Daftar
                </Button>
              </>
            )}
          </RenderIf>
        </div>
      </div>
    </header>
  )
}
