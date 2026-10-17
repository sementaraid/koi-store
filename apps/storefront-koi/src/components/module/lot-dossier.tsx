import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { Award, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/koi/badge"
import { MediaGallery, type MediaItem } from "@/components/module/media-gallery"
import { RenderIf } from "@/components/module/render-if"
import {
  BID_HIGHLIGHTS,
  TRUST_STAMPS,
  SELLER_KIND,
  type PillSpec,
} from "@/components/constant/stamps"
import type { AuctionProduct, ListingBase } from "@/components/types/product"

export type { MediaItem }

/** The stage's own switch: the breeder's stills, or the clip. Drawn only when
    the lot carries both — a tab strip over one kind is a control that cannot
    change anything. */
const MEDIA_TABS = [
  { value: "image", label: "Foto" },
  { value: "video", label: "Video" },
] as const

/** Props for {@link MediaStage}. */
export type MediaStageProps = {
  /** The lot's media, in display order. Empty renders nothing. */
  items: MediaItem[]
  /** Anything the surface puts over the viewer's lower edge — a live room's
      "just bid" line, say. Omitted, the viewer is bare. */
  overlay?: ReactNode
  className?: string
}

/**
 * The lot's media, with the two things a viewer over a photo needs on it:
 * which kind is showing, and where in the set it is.
 *
 * @remarks
 * A switch, not a filter: picking "Video" opens the first clip rather than
 * hiding the stills, so the strip under it keeps every item one pick away.
 *
 * ponytail: no lightbox. `Perbesar` in the reference needs a full-screen
 * viewer; add it when the kit has one to open, not as a button that does
 * nothing.
 */
export function MediaStage({ items, overlay, className }: MediaStageProps) {
  const [index, setIndex] = useState(0)
  if (!items.length) return null

  const at = Math.min(index, items.length - 1)
  const kind = items[at].kind
  const kinds = MEDIA_TABS.filter((tab) =>
    items.some((item) => item.kind === tab.value)
  )

  return (
    <div className={cn("relative flex flex-col gap-2.5", className)}>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3">
        <RenderIf when={kinds.length > 1}>
          {() => (
            <div className="pointer-events-auto flex gap-1.5">
              {kinds.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={kind === tab.value}
                  onClick={() =>
                    setIndex(items.findIndex((i) => i.kind === tab.value))
                  }
                  className={cn(
                    "rounded-full px-3.5 py-2 text-2xs font-bold text-white backdrop-blur-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    kind === tab.value
                      ? "bg-white/95 text-foreground"
                      : "bg-white/15 hover:bg-white/25"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </RenderIf>

        <span className="pointer-events-none ms-auto rounded-full bg-white/15 px-2.5 py-1 font-mono text-2xs text-white tabular-nums backdrop-blur-sm">
          {at + 1} / {items.length}
        </span>
      </div>

      <MediaGallery
        items={items}
        index={index}
        onSelect={setIndex}
        overlay={overlay}
      />
    </div>
  )
}

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

/** Props for {@link TrustLine}. */
export type TrustLineProps = {
  icon: typeof ShieldCheck
  title: string
  body: string
  /** A link or control the claim carries, e.g. the escrow regulation. Omitted,
      the line is copy alone. */
  action?: ReactNode
}

/** One line of what backs the money: a glyph, a claim, and its condition. */
export function TrustLine({ icon: Icon, title, body, action }: TrustLineProps) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
      <p className="min-w-0 text-xs leading-snug text-pretty">
        <strong className="font-bold">{title}</strong>{" "}
        <span className="text-muted-foreground">{body}</span>{" "}
        <RenderIf when={action}>{(node) => node}</RenderIf>
      </p>
    </li>
  )
}

/** A seller's initials, for the mark beside their name. Two letters, because
    that is what fits in a circle at this size. */
function initials(name?: string) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/** Props for {@link LotIdentity}. */
export type LotIdentityProps = {
  /** The product being named: its ref, its earned pills, its title and its
      seller. A lot on the floor and a koi sold outright both arrive here — the
      block reads four fields off whatever it is handed, and `highlights` is the
      one a fixed-price koi has none of. */
  lot: {
    id: string
    title: string
    listing?: ListingBase
    /** The floor's own distinction. A catalogue koi earns none, so it carries
        none, and the row is its ref and its trust stamps instead. */
    highlights?: AuctionProduct["highlights"]
    stamps?: AuctionProduct["stamps"]
  }
  className?: string
}

/**
 * What the product is called: its number, what the floor earned it, who stands
 * behind it, and who bred it.
 *
 * @remarks
 * The same block on a lot's page, in the room, and on a koi sold outright,
 * because it is the same question in all three places — whose koi is this and
 * what has it done — and two copies would eventually word the seller's standing
 * differently. Every surface reads the pills off the same `BID_HIGHLIGHTS` and
 * `TRUST_STAMPS` the grid tile does, so no surface can wear a badge another
 * denies.
 */
export function LotIdentity({ lot, className }: LotIdentityProps) {
  const { title, listing, highlights, stamps } = lot
  const badges = [...(highlights ?? []), ...(stamps ?? [])]
  const lookup = { ...BID_HIGHLIGHTS, ...TRUST_STAMPS }
  const { Icon: SellerIcon } = SELLER_KIND[listing?.sellerKind ?? "shop"]

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* The lot's own number opens the row: it is what the lot is called on
            the floor, and the title below it is what it is. */}
        <Badge variant="neutral" className="gap-1 font-mono">
          {listing?.ref ?? `Lot ${lot.id}`}
        </Badge>

        {badges.map((b) => {
          /* Typed as the spec, not the literal: the merged lookup's inferred
             type is a union of members only some of which carry an `Icon`. */
          const { label, variant, Icon }: PillSpec = lookup[b]
          return (
            <Badge key={b} variant={variant} className="gap-1">
              <RenderIf when={Icon}>{(I) => <I aria-hidden />}</RenderIf>
              {label}
            </Badge>
          )
        })}
      </div>

      <h1 className="font-heading text-3xl leading-tight font-extrabold text-balance">
        {title}
      </h1>

      {/* Who bred it, as a face rather than a field: a koi is bought from a
          farm, and the farm is what the buyer is really trusting. */}
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-extrabold"
        >
          {initials(listing?.seller)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-bold">{listing?.seller}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <SellerIcon aria-hidden className="size-3.5 shrink-0" />
            {listing?.sellerKind === "farm"
              ? "Breeder terdaftar"
              : "Penjual terdaftar"}
          </span>
        </span>
      </div>
    </div>
  )
}
