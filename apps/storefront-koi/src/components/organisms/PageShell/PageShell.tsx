import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { CONTAINER } from "@/const/layout"
import { BottomNav } from "@/components/cells/BottomNav/BottomNav"
import { Footer } from "@/components/organisms/Footer/Footer"
import { Header } from "@/components/organisms/Header/Header"
import { PageBreadcrumb, type Crumb } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
import { RenderIf } from "@koi/ui"
import type { HeaderBack } from "@/types/header"
import type { FeedShell } from "@/types/product"

export type PageShellProps = ComponentProps<"div"> &
  FeedShell & {
    bar?: ReactNode
    back?: HeaderBack
    /* A detail screen names itself in the mobile header (board 03) instead of
       showing the brand row and a breadcrumb. */
    mobileTitle?: string
    trail?: Crumb[]
  }

export function PageShell({
  account,
  activeHref,
  cart,
  bar,
  back,
  mobileTitle,
  trail,
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        // The mobile tab bar is fixed; reserve its height so it never covers
        // the footer. A page with another fixed bar overrides this.
        "flex min-h-svh flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0",
        className
      )}
      {...props}
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-xs focus:shadow-lg"
      >
        Lewati ke konten
      </a>

      <Header
        activeHref={activeHref}
        account={account}
        cart={cart}
        back={back}
        mobileTitle={mobileTitle}
      />

      <RenderIf when={bar}>{(node) => node}</RenderIf>

      <main id="konten" className="flex-1">
        <RenderIf when={trail?.length ? trail : undefined}>
          {(list) => (
            <div className={cn(CONTAINER, "pt-5", mobileTitle && "max-lg:hidden")}>
              <PageBreadcrumb trail={list} className="mb-0" />
            </div>
          )}
        </RenderIf>

        {children}
      </main>

      <Footer />

      <BottomNav signedIn={Boolean(account)} />
    </div>
  )
}
