import type { ReactNode } from "react"
import { cn } from "cn"

export type FeedGridProps = {
  children: ReactNode
  cols?: 3 | 4
  className?: string
}

const COLS = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const

export function FeedGrid({ children, cols = 4, className }: FeedGridProps) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", COLS[cols], className)}>
      {children}
    </div>
  )
}
