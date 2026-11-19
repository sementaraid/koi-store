import type { ComponentProps } from "react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import { AccountCluster } from "@/components/cells/AccountMenu/AccountCluster"
import { BackButton } from "@/components/cells/BackButton/BackButton"
import { BrandMark } from "@/components/cells/BrandMark/BrandMark"
import { CartLink } from "@/components/cells/CartLink/CartLink"
import { ChatLink } from "@/components/cells/ChatLink/ChatLink"
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

export type HeaderProps = ComponentProps<"header"> &
  HeaderBrand &
  HeaderSearch & {
    back?: HeaderBack
    links?: HeaderLink[]
    activeHref?: string
    account?: HeaderAccount
    cart?: HeaderCart
  }

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

        <span className="flex min-w-0 flex-1 justify-end lg:justify-start">
          <SearchField
            onSearch={onSearch}
            searchPlaceholder={searchPlaceholder}
            className="w-64 max-w-full shrink"
          />
        </span>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <RenderIf when={cart}>{(value) => <CartLink {...value} />}</RenderIf>

          <RenderIf when={account}>{() => <ChatLink />}</RenderIf>

          <RenderIf when={account}>
            {(value) => <AccountCluster account={value} />}
          </RenderIf>
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
