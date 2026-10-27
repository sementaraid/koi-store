import type { ComponentProps } from "react"
import { cn } from "cn"
import { BadgeCheck, Star } from "lucide-react"

import { TILE } from "@/const/surface"
import { Button } from "@/components/atoms/Button/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/Card/Card"
import { Link } from "@/components/atoms/Link/Link"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"

/** One figure a farm publishes about itself, e.g. `142` / `Kolam aktif`. */
export type PartnerFact = {
  /** The figure, already formatted for display. */
  value: string
  /** What it counts. */
  label: string
}

/**
 * A verified partner farm, as the directory card needs it.
 *
 * The monogram tile is drawn from `name`'s first letter rather than taking a
 * logo: farm artwork is not in the kit's asset pipeline, and a brick of
 * mismatched logos reads worse than a consistent initial.
 *
 * @example
 * const farm: PartnerFarm = {
 *   id: "blitar-premier",
 *   name: "Sentra Blitar Premier",
 *   location: "Jawa Timur, Indonesia",
 *   rating: 4.98,
 *   facts: [
 *     { value: "142", label: "Kolam aktif" },
 *     { value: "100%", label: "Sertifikat APKI" },
 *     { value: "1.240+", label: "Ikan terlelang" },
 *   ],
 *   speciality: "Kohaku, Sanke, Showa",
 *   href: "/farms/blitar-premier",
 * }
 */
export type PartnerFarm = {
  /** Stable farm id from the API. */
  id: string
  /** Farm name, e.g. `"Sentra Blitar Premier"`. */
  name: string
  /** Province and country, as the house writes it. Omitted when the seller
      record carries no location — the card then draws no line rather than an
      invented one. */
  location?: string
  /** Rating as published, e.g. `4.98`. Rendered to two decimals. Omitted when
      nothing publishes one; the star is then absent, not zero. */
  rating?: number
  /** At-a-glance figures. More or fewer wrap rather than clip; three is what
      the design row holds. Omitted — a real seller record has no counts to
      quote — the row is not drawn. */
  facts?: PartnerFact[]
  /** Varieties the farm breeds, e.g. `"Kohaku, Sanke, Showa"`. Omitted when the
      seller publishes none. */
  speciality?: string
  /** The farm's page. Also where the CTA points. */
  href: string
}

/** Props beyond the underlying card's, which pass straight through. */
export type PartnerCardProps = ComponentProps<typeof Card> & {
  partner: PartnerFarm
}

/**
 * Verified-breeder directory tile: monogram, name with the trust tick, location,
 * rating, a three-figure row, and the way into the farm's own page.
 *
 * Presentation only — a farm in, a card out. The tick is not a claim this
 * component makes: the directory only holds farms the house has inspected, so
 * every card carries it by definition.
 *
 * @example
 * <PartnerCard partner={farm} />
 */
export function PartnerCard({
  partner,
  className,
  ...props
}: PartnerCardProps) {
  const { name, location, rating, facts, speciality, href } = partner

  return (
    /* `sm` spacing: these sit three-up on the page, where the card's default
       gutter would push the facts row below the fold of the tile. */
    <Card
      data-slot="partner-card"
      size="sm"
      /* Same material as the product tile: flat + TILE standoff, no edge ring. */
      variant="flat"
      className={cn("w-full ring-0", TILE, className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-accent-ink"
          >
            {name.charAt(0)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <CardTitle className="flex items-center gap-1.5">
              <Link
                href={href}
                className="truncate rounded-sm transition-colors hover:text-accent-ink hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {name}
              </Link>
              <BadgeCheck
                role="img"
                aria-label="Terverifikasi"
                className="size-4 shrink-0 text-accent-ink"
              />
            </CardTitle>
            <RenderIf when={location}>
              {(where) => (
                <CardDescription className="truncate text-xs">
                  {where}
                </CardDescription>
              )}
            </RenderIf>
          </div>

          {/* A star with no figure behind it is a claim the house has not
              made, so an unrated farm shows none. */}
          <RenderIf when={rating}>
            {(score) => (
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums">
                <Star
                  aria-hidden
                  className="size-3.5 fill-gold-ink text-gold-ink"
                />
                {score.toFixed(2)}
              </span>
            )}
          </RenderIf>
        </div>
      </CardHeader>

      <RenderIf when={facts?.length ? facts : undefined}>
        {(rows) => (
          <CardContent>
            <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 px-2 py-2 text-center">
              {rows.map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 text-2xs text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-xs font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        )}
      </RenderIf>

      <CardFooter className="mt-auto justify-between gap-3">
        <span className="min-w-0 truncate text-2xs text-muted-foreground">
          <RenderIf when={speciality}>{(what) => <>Spesialis: {what}</>}</RenderIf>
        </span>
        <Button
          size="sm"
          variant="soft"
          render={<Link href={href} />}
          nativeButton={false}
          className="shrink-0"
        >
          Kunjungi Kolam
        </Button>
      </CardFooter>
    </Card>
  )
}
