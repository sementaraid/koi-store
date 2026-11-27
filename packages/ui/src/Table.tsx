import type { ComponentProps } from "react"
import { cn } from "cn"

/* koi table: the back office's record list. It renders a real table inside a
   horizontal scroll region, so a wide queue never pushes the page sideways on
   a phone. The region is focusable and named, because a scroll container that
   only responds to a trackpad is not reachable by keyboard.

   No card wrapper and no visual container: the table sits directly in the
   page content, with only the header row and hairline row dividers drawing it.
   The region carries the accessible name; there is no visible title or caption.
   A row that is itself the click target gets 44 px cells on phones through
   `interactive`. */

type TableProps = ComponentProps<"table"> & {
  /** Accessible name of the scroll region. Required: an unnamed scrollable region is not announced. */
  label: string
  /** Column floor; the wrapper scrolls while the page body stays put. */
  minWidth?: string
  /** Classes for the scroll wrapper, not the table. */
  containerClassName?: string
}

function Table({
  className,
  label,
  minWidth = "48rem",
  containerClassName,
  style,
  children,
  ...props
}: TableProps) {
  return (
    <div
      data-slot="table-container"
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        /* `relative` keeps absolutely positioned descendants (sr-only labels)
           inside this scroll region; without a positioned ancestor they escape
           the clip and widen the page on narrow screens. */
        "relative w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        containerClassName
      )}
    >
      <table
        data-slot="table"
        aria-label={label}
        className={cn("w-full text-left text-sm", className)}
        style={{ minWidth, ...style }}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "border-b border-divider text-xs tracking-wide text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableRow({
  className,
  interactive = false,
  ...props
}: ComponentProps<"tr"> & { interactive?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-divider transition-colors last:border-b-0 hover:bg-muted/50",
        interactive && "max-sm:cursor-pointer max-sm:[&>td]:py-4",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn("px-3 py-2.5 text-left align-bottom font-medium whitespace-nowrap", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 align-top", className)}
      {...props}
    />
  )
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
export type { TableProps }
