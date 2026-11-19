import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { CONTAINER } from "@/const/layout"
import { Footer } from "@/components/organisms/Footer/Footer"
import { Header } from "@/components/organisms/Header/Header"
import { PageBreadcrumb, type Crumb } from "@/components/cells/PageBreadcrumb/PageBreadcrumb"
import { RenderIf } from "@koi/ui"
import type { FeedShell } from "@/types/product"

export type PageShellProps = ComponentProps<"div"> &
  FeedShell & {
    bar?: ReactNode
    trail?: Crumb[]
  }

export function PageShell({
  account,
  activeHref,
  onSearch,
  cart,
  bar,
  trail,
  className,
  children,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn("flex min-h-svh flex-col bg-background", className)}
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
        onSearch={onSearch}
        account={account}
        cart={cart}
      />

      <RenderIf when={bar}>{(node) => node}</RenderIf>

      <main id="konten" className="flex-1">
        <RenderIf when={trail?.length ? trail : undefined}>
          {(list) => (
            <div className={`${CONTAINER} pt-5`}>
              <PageBreadcrumb trail={list} className="mb-0" />
            </div>
          )}
        </RenderIf>

        {children}
      </main>

      <Footer />
    </div>
  )
}
