import type { ReactNode } from "react"
import { cn } from "cn"

export type EyebrowProps = {
  children: ReactNode
  className?: string
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-2xs font-bold tracking-widest text-accent-ink uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}
