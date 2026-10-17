import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/koi/card"
import { Badge } from "@/components/koi/badge"
import { TILE } from "@/components/constant/surface"
import { RenderIf } from "@/components/module/render-if"
import { PulseIcon } from "@/components/module/pulse-icon"

import type { ProductCardProps } from "./product-card"
import type {
  ListingBase,
  SaleState,
  SellerKind,
} from "@/components/types/product"
import { formatPrice } from "@/helper/format-price"
import {
  SELLER_KIND,
  type PillSpec,
  type StateSpec,
} from "@/components/constant/stamps"

/**
 * The glyph beside a seller's name: a breeder's koi, or a shop's storefront.
 *
 * @remarks
 * Purely decorative — the seller's name is right next to it, so a screen reader
 * gains nothing from the icon twice. A listing that does not say what kind of
 * seller it is gets no mark rather than a guessed one.
 */
function SellerMark({ kind }: { kind?: SellerKind }) {
  return (
    <RenderIf when={kind}>
      {(k) => {
        const { Icon } = SELLER_KIND[k]
        return (
          <Icon
            aria-hidden
            data-slot="product-card-seller-kind"
            /* `shrink-0` so the glyph survives a long seller name, and the
               `-ml-0.5` pulls it back to the text's optical edge. */
            className="-ml-0.5 size-3 shrink-0 text-muted-foreground"
          />
        )
      }}
    </RenderIf>
  )
}

/**
 * What a treatment takes from the card, and forwards to the frame.
 *
 * @remarks
 * The card's own props are spread in rather than carried as a `rest` bag, so a
 * treatment is handable the same props the `Card` is — `onClick`, `aria-*`,
 * `data-*` — and TypeScript checks them at every call site instead of at none.
 */
export type TreatmentProps = Pick<
  ProductCardProps,
  "href" | "action" | "className"
> &
  /* `content` is dropped from the forwarded set: React types it as the RDFa
     attribute, so it would be a string on the card element and shadow
     {@link ProductFrame}'s own `content` slot — which is a node. */
  Omit<ComponentProps<typeof Card>, "href" | "className" | "content">

/** Props for {@link ProductFrame}: the shared half of every product tile. */
export type ProductFrameProps = TreatmentProps & {
  /** The headline. */
  title: string
  /** Photo. Omit and the card keeps a neutral placeholder block. */
  image?: string
  /** Who and what the product is. */
  listing?: ListingBase
  /** Pills over the photo: earned distinction, then state. */
  overlay?: ReactNode
  /** The kind's own facts: the taxonomy row and the price row. */
  content?: ReactNode
}

/**
 * The shell every product kind is drawn in: photo, pills, title, seller,
 * whatever the kind says about itself, and the CTA.
 *
 * @remarks
 * One card, several treatments. The kind-specific facts — a bid tally, a
 * countdown, a stock band — are built by the treatment and arrive here as
 * `content` and `overlay`; everything the kinds share (the tile material, the
 * title seam, the photo, the footer) is written once, so the two cards cannot
 * drift into looking like two kits.
 */
export function ProductFrame({
  title,
  image,
  listing,
  href,
  action,
  className,
  overlay,
  content,
  ...card
}: ProductFrameProps) {
  return (
    /* `relative` so the overlay anchors to the card, and the photo stays the
       card's first child — that is what keeps it flush, since the card's pt-0
       is a `> img:first-child` rule. */
    <Card
      data-slot="product-card"
      /* No edge ring: the standoff alone separates the tile from the page, and
         the hairline read as a stroke around the photo. `flat` drops the card's
         inset edge, `ring-0` the shadcn outer one. */
      variant="flat"
      /* `sm` tightens the card's spacing token to 4 and drops the title to
         `text-sm` — the scale a five-across grid tile needs, without every
         sub-part hand-tuning its own size. */
      size="sm"
      className={cn("relative w-full ring-0", TILE, className)}
      {...card}
    >
      {image ? (
        <img
          src={image}
          /* Decorative: the title next to it already names the product. */
          alt=""
          loading="lazy"
          className="aspect-4/3 w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="aspect-4/3 w-full bg-muted"
          data-slot="product-card-placeholder"
        />
      )}

      {overlay}

      <CardHeader>
        <CardTitle className="line-clamp-2">
          {href ? (
            <a
              href={href}
              className="rounded-sm transition-colors outline-none hover:text-accent-ink hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </CardTitle>

        <RenderIf when={listing?.ref || listing?.seller}>
          {() => (
            <CardDescription className="flex flex-wrap items-center gap-x-1.5 text-xs">
              <RenderIf when={listing?.ref}>
                {(ref) => <span className="tabular-nums">{ref}</span>}
              </RenderIf>
              <RenderIf when={listing?.ref && listing?.seller}>
                {() => <span aria-hidden>·</span>}
              </RenderIf>
              <RenderIf when={listing?.seller}>
                {(seller) => (
                  <span
                    className="flex min-w-0 items-center gap-1"
                    data-slot="product-card-seller"
                  >
                    <SellerMark kind={listing?.sellerKind} />
                    <span className="truncate">{seller}</span>
                  </span>
                )}
              </RenderIf>
            </CardDescription>
          )}
        </RenderIf>
      </CardHeader>

      {content}

      <RenderIf when={action}>
        {(a) => <CardFooter className="mt-auto">{a}</CardFooter>}
      </RenderIf>
    </Card>
  )
}

/** Props for {@link ProductOverlay}. */
export type ProductOverlayProps<H extends string> = {
  /** The earned marks to draw, in reading order. */
  highlights?: H[]
  /** Wording, tone and glyph per mark — the vocabulary this row reads. */
  lookup: Record<H, PillSpec>
  /** The state pill, drawn against the card edge after the highlights. */
  state?: StateSpec
}

/**
 * Pills over the photo's top-right: earned distinction, then state. State goes
 * last so it sits against the card edge — the top of the readability stack.
 *
 * @remarks
 * The row is `inset-x`, so the pills are bounded by the card and wrap onto a
 * second line on a narrow grid tile rather than overflowing it.
 */
export function ProductOverlay<H extends string>({
  highlights,
  lookup,
  state,
}: ProductOverlayProps<H>) {
  return (
    <RenderIf when={state || highlights?.length}>
      {() => (
        <div className="absolute inset-x-2 top-2 flex flex-wrap justify-end gap-1.5 inset-ring-0">
          {highlights?.map((h) => {
            const { label, variant, Icon } = lookup[h]
            return (
              <Badge
                key={h}
                variant={variant}
                className="h-4 shrink-0 px-1.5 text-2xs"
                data-slot="product-card-highlight"
              >
                {Icon ? <Icon aria-hidden /> : null}
                {label}
              </Badge>
            )
          })}

          <RenderIf when={state}>
            {(s) => (
              <Badge
                variant={s.variant}
                className="h-4 shrink-0 gap-1 px-1.5 text-2xs"
                data-slot="product-card-status"
              >
                <RenderIf when={s.pulse}>{() => <PulseIcon />}</RenderIf>
                {s.label}
              </Badge>
            )}
          </RenderIf>
        </div>
      )}
    </RenderIf>
  )
}

/** Props for {@link ProductFacts}. */
export type ProductFactsProps = {
  /** The listing whose category and spec lead the row. */
  listing?: ListingBase
  /** The price, and the unit it buys. Omitted, the whole price row drops. */
  sale?: SaleState
  /** The listing's secondary attributes, in given order. */
  info?: string[]
  /** Wording, tone and glyph per attribute. */
  infoLookup: Record<string, PillSpec>
  /** What the figure is called: "Bid" on the floor, "Harga" in the shop. */
  priceLabel: string
  /** The kind's own right-hand column: a bid tally and clock, or stock. */
  trailing?: ReactNode
}

/**
 * Category and spec, the listing's info attributes, then the money.
 *
 * @remarks
 * The price row is one component for both kinds, because there is only ever one
 * price row: a lot leaves it without a countdown, a simple product without a
 * tally, and a good sold by weight adds its unit to the figure.
 */
export function ProductFacts({
  listing,
  sale,
  info,
  infoLookup,
  priceLabel,
  trailing,
}: ProductFactsProps) {
  const { category, spec } = listing ?? {}
  const price = sale?.price

  return (
    <CardContent className="flex flex-col gap-3">
      <RenderIf when={category || spec || info?.length}>
        {() => (
          <div className="flex flex-wrap gap-1.5">
            <RenderIf when={category}>
              {(c) => (
                <Badge variant="neutral" className="h-4 px-1.5 text-2xs">
                  {c}
                </Badge>
              )}
            </RenderIf>
            <RenderIf when={spec}>
              {(s) => (
                <Badge
                  variant="muted"
                  className="h-4 px-1.5 text-2xs tabular-nums"
                >
                  {s}
                </Badge>
              )}
            </RenderIf>
            {info?.map((i) => {
              const { label, variant, Icon } = infoLookup[i]
              return (
                <Badge
                  key={i}
                  variant={variant}
                  className="h-4 px-1.5 text-2xs"
                  data-slot="product-card-info"
                >
                  <RenderIf when={Icon}>
                    {(Icon) => <Icon aria-hidden />}
                  </RenderIf>
                  {label}
                </Badge>
              )
            })}
          </div>
        )}
      </RenderIf>

      {price !== undefined ? (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xs text-muted-foreground">{priceLabel}</div>
            {/* One step under the title's `text-sm`, so a Rupiah figure wider
                than the tile cannot out-shout what it is pricing. */}
            <div className="truncate text-sm font-semibold tabular-nums">
              {formatPrice(price, sale?.currency)}
              <RenderIf when={sale?.unit}>
                {(unit) => (
                  <span className="text-2xs font-normal text-muted-foreground">
                    {" "}
                    / {unit}
                  </span>
                )}
              </RenderIf>
            </div>
          </div>

          {trailing ? (
            <div className="shrink-0 text-end text-2xs text-muted-foreground">
              {trailing}
            </div>
          ) : null}
        </div>
      ) : null}
    </CardContent>
  )
}
