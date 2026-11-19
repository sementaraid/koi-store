import type { MouseEvent } from "react"
import { cn } from "cn"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@koi/ui/primitives/pagination"
import { RenderIf } from "@koi/ui"

export type FeedPaginationProps = {
  page: number
  pageCount: number
  href: string
  onPageChange?: (page: number) => void
  className?: string
}

export function FeedPagination({
  page,
  pageCount,
  href,
  onPageChange,
  className,
}: FeedPaginationProps) {
  const pageHref = (target: number) =>
    `${href}${href.includes("?") ? "&" : "?"}page=${target}`

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
                href={pageHref(page - 1)}
                onClick={to(page - 1)}
              />
            </PaginationItem>

            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href={pageHref(p)}
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
                href={pageHref(page + 1)}
                onClick={to(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </RenderIf>
  )
}
