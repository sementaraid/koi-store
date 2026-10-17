import type { MouseEvent } from "react"
import { cn } from "cn"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { RenderIf } from "@/components/module/render-if"

/** Props for {@link FeedPagination}. */
export type FeedPaginationProps = {
  /** The page being drawn, 1-based, already clamped. */
  page: number
  /** Pages available. At least 1; nothing is drawn for a single page. */
  pageCount: number
  /** The feed's own path, e.g. `"/catalogs"`. Every link is `href={base}?page=n`,
      so a page link still works in a no-JS form post or after a router lands —
      and the `onPageChange` is optional for the same reason. */
  href: string
  /** Called with the 1-based page the visitor picked. Omitted, the anchors are
      the navigation. */
  onPageChange?: (page: number) => void
  className?: string
}

/**
 * The pager under a feed's grid: previous, every page, next.
 *
 * @remarks
 * One pager for the floor, the catalog, the shop and the grid under a lot.
 * Every one of them drew this by hand, and every one of them carried the same
 * three bugs-in-waiting: the clamped-edge `aria-disabled`, the `tabIndex` that
 * keeps the dead control out of the tab order, and the `preventDefault` that
 * only fires when the caller actually handles the change. Four copies of that
 * is four chances to fix one and forget the others.
 *
 * Drawn only when there is more than one page — a pager over one page is a
 * control that cannot change anything.
 *
 * @example
 * <FeedPagination
 *   page={current}
 *   pageCount={pageCount}
 *   href="/catalogs"
 *   onPageChange={onPageChange}
 * />
 */
export function FeedPagination({
  page,
  pageCount,
  href,
  onPageChange,
  className,
}: FeedPaginationProps) {
  /** Handled, the anchor stays a real href for the router to intercept;
      unhandled, it is the navigation. */
  const to = (target: number) =>
    onPageChange &&
    ((event: MouseEvent) => {
      event.preventDefault()
      onPageChange(target)
    })

  return (
    <RenderIf when={pageCount > 1}>
      {() => (
        <Pagination className={cn("mt-10", className)}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Sebelumnya"
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : undefined}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
                href={`${href}?page=${page - 1}`}
                onClick={to(page - 1)}
              />
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href={`${href}?page=${p}`}
                  isActive={p === page}
                  onClick={to(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                text="Berikutnya"
                aria-disabled={page === pageCount}
                tabIndex={page === pageCount ? -1 : undefined}
                className={
                  page === pageCount ? "pointer-events-none opacity-50" : ""
                }
                href={`${href}?page=${page + 1}`}
                onClick={to(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </RenderIf>
  )
}
