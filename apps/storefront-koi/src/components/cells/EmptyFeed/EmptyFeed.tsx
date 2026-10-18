import type { ReactNode } from "react"
import { cn } from "cn"

import { Button } from "@/components/atoms/Button/Button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"

/** Props for {@link EmptyFeed}. */
export type EmptyFeedProps = {
  /** The glyph in the medallion — the same one the page's eyebrow carries. */
  icon: ReactNode
  /** Heading for a *narrowed* feed that matched nothing. */
  noMatchTitle: string
  /** The way out of that narrowing, as one sentence. */
  noMatchBody: string
  /** Heading for a feed with nothing in it at all. Omitted, the no-match copy
      stands in — a grid with no empty-of-its-own state to word, e.g. the floor
      under a lot's own page, says the same thing either way. */
  emptyTitle?: string
  /** What the visitor can do about that instead. Falls back with `emptyTitle`. */
  emptyBody?: string
  /** Whether the feed is narrowed. Picks the copy, and whether a reset is
      offered — a narrowing can be undone, an empty shelf cannot. */
  narrowing: boolean
  /** Resets the filter. Called only when `narrowing`. */
  onReset?: () => void
  /** The forward door under the reset, e.g. a link to the floor or the guide.
      Omitted, the actions row is the reset alone. */
  action?: ReactNode
  className?: string
}

/**
 * What a feed shows when it has nothing to draw.
 *
 * @remarks
 * Three pages drew this identically, and each one worded its own copy — which
 * is right, because a narrowed catalog and an empty shelf are not the same
 * event. What is shared is the frame: the dashed panel, the medallion, the
 * ghost reset, and the rule that the reset appears only when there is a
 * narrowing to undo.
 *
 * @example
 * <EmptyFeed
 *   icon={<Gavel aria-hidden />}
 *   narrowing={narrowing}
 *   noMatchTitle="Tidak ada lot yang cocok"
 *   noMatchBody="Coba longgarkan filter, atau lihat semua lot yang sedang dibuka."
 *   emptyTitle="Belum ada lot"
 *   emptyBody="Lelang berikutnya dibuka setiap Selasa dan Jumat pukul 20.00 WIB."
 *   onReset={() => onFilterChange?.(DEFAULT_AUCTION_FILTER)}
 *   action={<Button render={<Link href="/panduan" />} nativeButton={false}>Cara bidding</Button>}
 * />
 */
export function EmptyFeed({
  icon,
  noMatchTitle,
  noMatchBody,
  emptyTitle,
  emptyBody,
  narrowing,
  onReset,
  action,
  className,
}: EmptyFeedProps) {
  return (
    <Empty
      className={cn(
        "border border-dashed border-border bg-muted/20",
        className
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{narrowing ? noMatchTitle : (emptyTitle ?? noMatchTitle)}</EmptyTitle>
        <EmptyDescription>
          {narrowing ? noMatchBody : (emptyBody ?? noMatchBody)}
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <RenderIf when={narrowing}>
          {() => (
            <Button variant="outline" onClick={onReset}>
              Reset filter
            </Button>
          )}
        </RenderIf>
        <RenderIf when={action}>{(node) => node}</RenderIf>
      </EmptyContent>
    </Empty>
  )
}
