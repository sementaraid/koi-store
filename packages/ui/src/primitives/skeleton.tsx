import type { ComponentProps } from "react"
import { cn } from "cn"

/* koi skeleton: a flat `bg-surface` block with a slow pulse that stops under
   `prefers-reduced-motion`. Size it with className. Hidden from screen readers;
   the surrounding region carries `aria-busy` / a status message. */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-control bg-surface motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
