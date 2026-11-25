import type { ReactNode } from "react"
import { cn } from "cn"

import { Badge } from "@koi/ui"
import { CONTAINER } from "@/const/layout"
import { Eyebrow } from "@/components/atoms/Eyebrow/Eyebrow"

export type FeedHeroProps = {
  eyebrow: ReactNode
  title: string
  lede: string
  stat: ReactNode
  className?: string
}

export function FeedHero({
  eyebrow,
  title,
  lede,
  stat,
  className,
}: FeedHeroProps) {
  return (
    <section className={cn("border-b border-border bg-muted/40", className)}>
      <div className={`${CONTAINER} py-8 max-sm:py-5 lg:py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-4 max-sm:gap-3">
          <div className="flex flex-col gap-2 max-sm:gap-1.5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="font-heading text-3xl font-extrabold max-sm:text-2xl lg:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground max-sm:text-[13px]">
              {lede}
            </p>
          </div>

          <Badge variant="live" className="gap-1.5 px-3 max-sm:px-2.5 max-sm:text-xs">
            {stat}
          </Badge>
        </div>
      </div>
    </section>
  )
}
