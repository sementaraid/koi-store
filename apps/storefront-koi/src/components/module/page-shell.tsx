import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { CONTAINER } from "@/components/constant/layout"
import { Footer } from "@/components/module/footer"
import { Header } from "@/components/module/header"
import { PageBreadcrumb, type Crumb } from "@/components/module/page-breadcrumb"
import { RenderIf } from "@/components/module/render-if"
import type { FeedShell } from "@/components/types/product"

/** Props for {@link PageShell}: whose bar it wears, and what it opens with. */
export type PageShellProps = ComponentProps<"div"> &
  FeedShell & {
    /** A band between the bar and the page's body — a broadcast's ticker, say.
        Omitted, the body starts at the bar. */
    bar?: ReactNode
    /** Where the page sits, floor first. Omitted, the body starts at the bar —
        a page with nothing above it states no position. */
    trail?: Crumb[]
  }

/**
 * The frame every koi page is drawn in: the site bar, the body, the floor's
 * footer, and the way past the nav.
 *
 * @remarks
 * Extracted because six pages drew it by hand and no two agreed: the skip link
 * was in some of them, on two different type scales, the body's id was sometimes
 * `konten` and sometimes absent — so the one page that had the link had it
 * pointing at nothing on half the site. The frame is also the only place that
 * knows the bar and the footer are the same two on every page, which is what
 * makes "the header" one component rather than one per page.
 *
 * The body carries `id="konten"`, which is what the skip link jumps to, and it
 * is `flex-1` so a short page still pushes the footer to the viewport's foot.
 *
 * @example
 * <PageShell activeHref="/live" account={session} onSearch={search}>
 *   <section>…</section>
 * </PageShell>
 *
 * @see {@link FeedShell} for the three props the bar takes.
 */
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
      {/* Keyboard users reach the floor without walking the nav: first in the
          DOM, hidden until focused. */}
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
        {/* The trail belongs to the frame, in the page's own gutter, drawn
            before anything the body says. A page that opens with a band rather
            than a position says so by passing no `trail` at all. */}
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
