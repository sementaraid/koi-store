import type { ReactNode } from "react"
import { cn } from "cn"
import { CONTAINER } from "@/const/layout"

export type LotLayoutProps = {
  media: ReactNode
  aside: ReactNode
  className?: string
}

export function LotLayout({ media, aside, className }: LotLayoutProps) {
  return (
    <div className={cn(CONTAINER, "pt-5 pb-8", className)}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-10 lg:col-span-7">{media}</div>
        <aside className="flex flex-col gap-5 lg:col-span-5">{aside}</aside>
      </div>
    </div>
  )
}
