import type { ReactNode } from "react"
import { cn } from "cn"
import { Award } from "lucide-react"

import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import type { AuctionProduct, ListingBase } from "@/types/product"

/** Props for {@link SpecCell}. */
export type SpecCellProps = {
  label: string
  value?: string
  className?: string
}

/** One cell of the spec sheet: a quiet tile, not a labelled row. */
export function SpecCell({ label, value, className }: SpecCellProps) {
  /* `null` rather than a wrapping {@link RenderIf}, so a missing fact leaves no
     gap behind — the grid's own gap does the spacing, so the layout stays
     honest however many facts are absent. */
  if (!value) return null

  return (
    <div className={cn("rounded-xl bg-muted/60 px-4 py-3.5", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-xs font-bold text-pretty tabular-nums">
        {value}
      </dd>
    </div>
  )
}

/** Props for {@link SpecSheet}. */
export type SpecSheetProps = {
  /** What the lot is. Its `awards` opens the sheet, its facts fill the grid. */
  listing?: ListingBase
  /** Secondary attributes the sheet reads a fact off, e.g. the sex. */
  info?: AuctionProduct["info"]
  /** A way to the fuller page, drawn beside the heading. Omitted, no link. */
  action?: ReactNode
  className?: string
}

/**
 * The lot's spec sheet: what it won, then what it is.
 *
 * @remarks
 * The award sits above the grid rather than in it, because it is the one line
 * of the sheet a bidder reads first and a grid cell gives every fact the same
 * weight. Gold is the kit's own `attention` tone, not a new one.
 */
export function SpecSheet({
  listing,
  info,
  action,
  className,
}: SpecSheetProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="text-2xs font-bold tracking-widest text-muted-foreground uppercase">
          Spesifikasi
        </h2>
        <RenderIf when={action}>{(node) => node}</RenderIf>
      </div>

      <RenderIf when={listing?.awards}>
        {(awards) => (
          <div className="flex items-center gap-3 rounded-xl bg-[oklch(0.84_0.14_85)]/25 px-4 py-3.5">
            <Award aria-hidden className="size-5 shrink-0 text-gold-ink" />
            <p className="text-xs font-bold text-pretty">{awards}</p>
          </div>
        )}
      </RenderIf>

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <SpecCell label="Varietas" value={listing?.category} />
        <SpecCell label="Ukuran" value={listing?.spec} />
        <SpecCell
          label="Kelamin"
          value={info?.includes("female") ? "Betina" : undefined}
        />
        <SpecCell label="Umur" value={listing?.age} />
        <SpecCell
          className="sm:col-span-2"
          label="Bloodline"
          value={listing?.bloodline}
        />
      </dl>
    </section>
  )
}
