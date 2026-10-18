import type { ReactNode } from "react"
import { cn } from "cn"

import { Badge } from "@/components/atoms/Badge/Badge"
import { CONTAINER } from "@/const/layout"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"

/** Props for {@link FeedHero}. */
export type FeedHeroProps = {
  /** The small caps label and its glyph, e.g. a gavel and `"Katalog Lelang"`. */
  eyebrow: ReactNode
  /** The page's `h1`. */
  title: string
  /** The one paragraph under it, already worded for this feed. */
  lede: string
  /** The count pill on the right — a glyph and its sentence. */
  stat: ReactNode
  className?: string
}

/**
 * The band at the top of a feed page: what page you are on, what is on it, and
 * how much of it there is.
 *
 * @remarks
 * The floor, the catalog and the shop opened with the same section, hand-drawn
 * three times and identical to the letter — the same border, the same tone, the
 * same two-line heading block, the same hollow-red count pill at the tail. Only
 * the words and the glyphs were ever the page's, so those are all this takes.
 *
 * The count is meant to be read off the *unfiltered* feed: it describes the
 * seller's shelf, not the narrowing the controls below are about to apply.
 *
 * @example
 * <FeedHero
 *   eyebrow={<><Gavel aria-hidden className="size-3.5" />Katalog Lelang</>}
 *   title="Lelang hari ini"
 *   lede="Semua lot yang sedang dibuka, akan datang, dan sudah selesai."
 *   stat={<><PulseIcon />{live} lot live</>}
 * />
 */
export function FeedHero({
  eyebrow,
  title,
  lede,
  stat,
  className,
}: FeedHeroProps) {
  return (
    <section className={cn("border-b border-border bg-muted/40", className)}>
      <div className={`${CONTAINER} py-8 lg:py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="font-heading text-3xl font-extrabold lg:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {lede}
            </p>
          </div>

          <Badge variant="live" className="h-7 gap-1.5 px-3 text-[13px]">
            {stat}
          </Badge>
        </div>
      </div>
    </section>
  )
}
