import type { ReactNode } from "react"
import { cn } from "cn"
import { Award } from "lucide-react"

import { RenderIf } from "@koi/ui"
import type { AuctionProduct, ListingBase } from "@/types/product"

export type SpecCellProps = {
  label: string
  value?: string
  className?: string
}

export function SpecCell({ label, value, className }: SpecCellProps) {
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

export type SpecSheetProps = {
  listing?: ListingBase
  info?: AuctionProduct["info"]
  action?: ReactNode
  className?: string
}

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
