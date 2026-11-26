import type { ReactNode } from "react"
import { cn } from "cn"

import { Badge } from "@koi/ui"
import { CONTAINER } from "@/const/layout"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"

export type FeedHeroProps = {
  eyebrow: ReactNode
  title: string
  lede: string
  stat?: ReactNode
  // The status tabs sit on the title row on desktop and stack under the band
  // copy on a phone, as on /lelang (US-097 AC12).
  tabs?: ReactNode
  className?: string
}

// The listing band shared by /katalog and /toko: surface, eyebrow, title, lede
// and the status tabs on the right. The same shape as /lelang's hero.
export function FeedHero({
  eyebrow,
  title,
  lede,
  stat,
  tabs,
  className,
}: FeedHeroProps) {
  return (
    <section
      data-slot="feed-hero"
      className={cn("border-b border-divider bg-surface", className)}
    >
      <div className={`${CONTAINER} flex flex-col gap-4 py-8 max-sm:gap-3 max-sm:py-5 lg:py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 max-sm:flex-col max-sm:items-stretch">
          <div className="flex flex-col gap-2 max-sm:gap-1.5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="font-heading text-3xl font-extrabold max-sm:text-2xl lg:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground max-sm:text-[13px]">
              {lede}
            </p>
          </div>

          {stat || tabs ? (
            <div className="flex flex-wrap items-center gap-3 max-sm:flex-col max-sm:items-stretch">
              {stat ? (
                <Badge
                  variant="live"
                  className="gap-1.5 px-3 max-sm:self-start max-sm:px-2.5 max-sm:text-xs"
                >
                  {stat}
                </Badge>
              ) : null}
              {tabs}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
