import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, RenderIf } from "@koi/ui"
import { TILE } from "@koi/ui/surface"
import { PulseIcon } from "@/components/atoms/PulseIcon/PulseIcon"

import type { ProductCardProps } from "./ProductCard"
import type {
  ListingBase,
  SaleState,
  SellerKind,
} from "@/types/product"
import { formatPrice } from "@/lib/helpers/format-price"
import {
  SELLER_KIND,
  type PillSpec,
  type StateSpec,
} from "@/const/stamps"

function SellerMark({ kind }: { kind?: SellerKind }) {
  return (
    <RenderIf when={kind}>
      {(k) => {
        const { Icon } = SELLER_KIND[k]
        return (
          <Icon
            aria-hidden
            data-slot="product-card-seller-kind"
            className="-ml-0.5 size-3 shrink-0 text-muted-foreground"
          />
        )
      }}
    </RenderIf>
  )
}

export type TreatmentProps = Pick<
  ProductCardProps,
  "href" | "action" | "className"
> &
  Omit<ComponentProps<typeof Card>, "href" | "className" | "content">

export type ProductFrameProps = TreatmentProps & {
  title: string
  image?: string
  listing?: ListingBase
  overlay?: ReactNode
  content?: ReactNode
}

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
    <Card
      data-slot="product-card"
      variant="flat"
      size="sm"
      className={cn("relative w-full ring-0", TILE, className)}
      {...card}
    >
      <RenderIf when={image}>
        {(src) => (
          <img
            src={src}
            alt=""
            loading="lazy"
            className="aspect-3/2 w-full object-cover"
          />
        )}
      </RenderIf>
      <RenderIf when={!image}>
        {() => (
          <div
            aria-hidden
            className="aspect-3/2 w-full bg-muted"
            data-slot="product-card-placeholder"
          />
        )}
      </RenderIf>

      {overlay}

      <CardHeader>
        <CardTitle className="line-clamp-2">
          <RenderIf when={href}>
            {(to) => (
              <a
                href={to}
                className="rounded-sm outline-none transition-colors after:absolute after:inset-0 after:rounded-card hover:text-accent-ink hover:underline focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
              >
                {title}
              </a>
            )}
          </RenderIf>
          <RenderIf when={!href}>{() => title}</RenderIf>
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
        {(a) => (
          // Above the stretched title link, so the action stays clickable
          // while the rest of the card opens the detail page.
          <CardFooter className="relative z-10 mt-auto">{a}</CardFooter>
        )}
      </RenderIf>
    </Card>
  )
}

export type ProductOverlayProps<H extends string> = {
  highlights?: H[]
  lookup: Record<H, PillSpec>
  state?: StateSpec
}

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
                <RenderIf when={Icon}>{(Glyph) => <Glyph aria-hidden />}</RenderIf>
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

export type ProductFactsProps = {
  listing?: ListingBase
  sale?: SaleState
  info?: string[]
  infoLookup: Record<string, PillSpec>
  priceLabel: string
  trailing?: ReactNode
}

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

      <RenderIf when={price !== undefined}>
        {() => (
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xs text-muted-foreground">{priceLabel}</div>
              <div className="truncate text-sm font-semibold tabular-nums">
                {formatPrice(price!, sale?.currency)}
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

            <RenderIf when={trailing}>
              {(node) => (
                <div className="shrink-0 text-end text-2xs text-muted-foreground">
                  {node}
                </div>
              )}
            </RenderIf>
          </div>
        )}
      </RenderIf>
    </CardContent>
  )
}
