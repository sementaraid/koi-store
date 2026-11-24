import type { ReactNode } from "react"
import { cn } from "cn"
import { CONTAINER } from "@/const/layout"

export type LotLayoutProps = {
  media: ReactNode
  aside: ReactNode
  // The lot page keeps its bid panel in view while the gallery scrolls
  // (US-098 AC3); the other pages leave the aside in normal flow.
  stickyAside?: boolean
  className?: string
}

export function LotLayout({ media, aside, stickyAside, className }: LotLayoutProps) {
  return (
    <div className={cn(CONTAINER, "pt-5 pb-8", className)}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-7">{media}</div>
        <aside
          className={cn(
            "flex flex-col gap-5 lg:col-span-5",
            stickyAside && "lg:sticky lg:top-20 lg:self-start"
          )}
        >
          {aside}
        </aside>
      </div>
    </div>
  )
}
