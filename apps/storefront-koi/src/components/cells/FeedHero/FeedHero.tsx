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
