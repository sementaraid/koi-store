import type { ComponentProps } from "react"
import { Wallet } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import { SITE_NAME } from "@/const/site"
import { AccountMenu } from "@/components/cells/AccountMenu/AccountMenu"
import { BrandMark } from "@/components/cells/BrandMark/BrandMark"
import { DEFAULT_BRAND_ICON, DEFAULT_LINKS } from "@/const/header"
import { NavLinks } from "@/components/cells/NavLinks/NavLinks"
import { formatPrice, formatPriceCompact } from "@/lib/helpers/format-price"
import type { HeaderAccount, HeaderBrand, HeaderLink } from "@/types/header"

export type * from "@/types/header"

export type HeaderProps = ComponentProps<"header"> &
  HeaderBrand & {
    links?: HeaderLink[]
    /* The current item comes from the pathname; the 404 card turns it off. */
    markActive?: boolean
    account?: HeaderAccount
  }

/**
 * US-103 AC1/AC9: 56 px on mobile, 64 px on desktop. Mobile keeps the brand mark
 * and, signed in, the balance chip. From `lg` the text wordmark and the nav take
 * over, and a signed-in customer gets the indigo balance pill, Bid Saya and the
 * avatar menu. No search box and no notification bell (D-066).
 */
export function Header({
  brandIcon = DEFAULT_BRAND_ICON,
  brandHref = ROUTES.home,
  links = DEFAULT_LINKS,
  markActive = true,
  account,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      data-slot="header"
      className={cn(
        "sticky top-0 z-50 w-full border-b border-divider bg-card",
        // The lot page draws its own mobile header (back and lot number).
        "group-has-[[data-shell=lot-header]]/shell:max-lg:hidden",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          CONTAINER,
          "flex h-14 items-center gap-2 lg:h-16 lg:gap-8"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 lg:flex-none lg:gap-8">
          {/* AC1: the phone header keeps the fish mark. */}
          <div className="lg:hidden">
            <BrandMark brandIcon={brandIcon} brandHref={brandHref} />
          </div>

          <Link
            href={brandHref}
            className="hidden shrink-0 rounded-sm text-base font-bold tracking-[-0.01em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline"
          >
            {SITE_NAME}
            <span className="text-accent-ink">.</span>
          </Link>

          <nav aria-label="Utama" className="hidden lg:flex">
            <NavLinks links={links} markActive={markActive} />
          </nav>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <RenderIf when={account}>
            {(value) => <BalanceChip account={value} />}
          </RenderIf>

          <RenderIf when={account}>
            {() => (
              <Link
                href={ROUTES.myBids}
                className="hidden h-10 items-center rounded-md px-2 text-sm font-semibold text-foreground outline-none hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
              >
                Bid Saya
              </Link>
            )}
          </RenderIf>

          <RenderIf when={account}>
            {(value) => <AccountMenu account={value} />}
          </RenderIf>
          <RenderIf when={!account}>
            {() => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-3 lg:h-10 lg:px-3"
                  render={<Link href={ROUTES.login} />}
                >
                  Masuk
                </Button>
                <Button
                  size="sm"
                  className="h-11 px-3 lg:h-10 lg:px-4"
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

/** Mobile shows the compact scale word (`Rp 3,2 jt`); desktop the indigo pill. */
function BalanceChip({ account }: { account: HeaderAccount }) {
  if (account.balance === undefined) return null

  return (
    <Link
      href={ROUTES.saldoTopup}
      aria-label={`Saldo ${formatPrice(account.balance)}. Isi saldo`}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-divider bg-surface px-2.5 text-xs font-bold text-foreground tabular-nums outline-none hover:border-border focus-visible:ring-2 focus-visible:ring-ring lg:h-10 lg:min-h-10 lg:gap-2 lg:border-primary/30 lg:bg-accent lg:px-3 lg:text-sm lg:font-semibold lg:text-accent-ink lg:hover:border-primary/50"
    >
      <Wallet aria-hidden className="hidden size-4 lg:inline" />
      <span className="lg:hidden">{formatPriceCompact(account.balance)}</span>
      <span className="hidden lg:inline">{formatPrice(account.balance)}</span>
    </Link>
  )
}
