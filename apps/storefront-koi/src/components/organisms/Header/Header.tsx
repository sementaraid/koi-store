import type { ComponentProps } from "react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import { AccountMenu } from "@/components/cells/AccountMenu/AccountMenu"
import { BackButton } from "@/components/cells/BackButton/BackButton"
import { BrandMark } from "@/components/cells/BrandMark/BrandMark"
import { CartLink } from "@/components/cells/CartLink/CartLink"
import { ChatLink } from "@/components/cells/ChatLink/ChatLink"
import { DEFAULT_BRAND_ICON, DEFAULT_LINKS } from "@/const/header"
import { NavLinks } from "@/components/cells/NavLinks/NavLinks"
import { formatPrice, formatPriceCompact } from "@/lib/helpers/format-price"
import type {
  HeaderAccount,
  HeaderBack,
  HeaderBrand,
  HeaderCart,
  HeaderLink,
} from "@/types/header"

export type * from "@/types/header"

export type HeaderProps = ComponentProps<"header"> &
  HeaderBrand & {
    back?: HeaderBack
    /* Board 03: a detail screen swaps the mobile brand row for
       (back, title) while the desktop header keeps the brand and nav. */
    mobileTitle?: string
    links?: HeaderLink[]
    activeHref?: string
    account?: HeaderAccount
    cart?: HeaderCart
  }

/**
 * US-103 AC1/AC3: 56 px on mobile, 64 px on desktop. Mobile shows the brand and,
 * signed in, the balance chip; the desktop nav and account menu take over from
 * `lg`. The search box and notification bell are gone.
 */
export function Header({
  brandIcon = DEFAULT_BRAND_ICON,
  brandHref = "/",
  back,
  mobileTitle,
  links = DEFAULT_LINKS,
  activeHref,
  account,
  cart,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-50 w-full border-b border-divider bg-card",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          CONTAINER,
          "flex h-14 items-center gap-2 lg:h-16 lg:gap-4"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:flex-none lg:gap-4">
          <RenderIf when={back}>
            {(value) => (
              <BackButton
                {...value}
                className="lg:hidden [&_svg:not([class*='size-'])]:size-5"
              />
            )}
          </RenderIf>
          <span className={cn(mobileTitle && "max-lg:hidden")}>
            <BrandMark brandIcon={brandIcon} brandHref={brandHref} />
          </span>
          <RenderIf when={mobileTitle}>
            {(title) => (
              <span className="min-w-0 flex-1 truncate text-[15px] leading-6 font-semibold lg:hidden">
                {title}
              </span>
            )}
          </RenderIf>
          <nav aria-label="Main" className="hidden lg:flex">
            <NavLinks links={links} activeHref={activeHref} />
          </nav>
        </div>

        <div
          className={cn(
            "ms-auto flex shrink-0 items-center gap-1.5 lg:gap-3",
            mobileTitle && "max-lg:hidden"
          )}
        >
          <RenderIf when={account}>
            {(value) => <BalanceChip account={value} />}
          </RenderIf>

          <Link
            href={ROUTES.myBids}
            className="hidden h-11 items-center rounded-md px-2 text-xs font-bold text-foreground outline-none hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
          >
            Bid Saya
          </Link>

          <RenderIf when={cart}>{(value) => <CartLink {...value} />}</RenderIf>

          <RenderIf when={account}>{() => <ChatLink />}</RenderIf>

          <RenderIf when={account}>
            {(value) => <AccountMenu account={value} />}
          </RenderIf>
          <RenderIf when={!account}>
            {() => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3 lg:h-8 lg:px-2.5"
                  render={<Link href={ROUTES.login} />}
                >
                  Masuk
                </Button>
                <Button
                  size="sm"
                  className="h-11 px-3 lg:h-8 lg:px-2.5"
                  render={<Link href={ROUTES.signup} />}
                >
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

/** Mobile shows the compact scale word (`Rp 3,2 jt`), desktop the full amount. */
function BalanceChip({ account }: { account: HeaderAccount }) {
  if (account.balance === undefined) return null

  return (
    <Link
      href={ROUTES.topup}
      aria-label={`Saldo ${formatPrice(account.balance)}. Isi saldo`}
      className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-divider bg-surface px-2.5 text-xs font-bold text-foreground tabular-nums outline-none hover:border-border focus-visible:ring-2 focus-visible:ring-ring lg:min-h-9 lg:px-3"
    >
      <span className="lg:hidden">{formatPriceCompact(account.balance)}</span>
      <span className="hidden lg:inline">{formatPrice(account.balance)}</span>
    </Link>
  )
}
