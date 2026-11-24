import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* koi badge: a flat status chip, not a control. 24 px high, 12 px bold text,
   14 px icon, 4 px radius, 1 px edge, no shadow. Status is never colour alone:
   the label is required, and every variant takes an `icon`.

   - `signal`   live, outbid (solid red)
   - `success`  highest bid, won, paid (solid green)
   - `warning`  needs action (solid amber)
   - `neutral`  everything else (grey surface)

   The older names below stay so existing callers keep working. They are aliases
   onto the four above (plus `muted` and `info`) and can be migrated screen by
   screen. */

const SIGNAL = "border-signal bg-signal text-signal-foreground"
const SUCCESS = "border-success bg-success text-success-foreground"
const WARNING = "border-warning bg-warning text-warning-foreground"
const NEUTRAL = "border-border bg-surface text-foreground"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-badge border px-2 text-xs font-bold whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        signal: SIGNAL,
        success: SUCCESS,
        warning: WARNING,
        neutral: NEUTRAL,
        /* aliases */
        live: SIGNAL,
        urgent: SIGNAL,
        attention: WARNING,
        muted: "border-border bg-muted text-muted-foreground",
        info: "border-accent bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
)

type BadgeProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof badgeVariants> & {
    /* the text label: required, so status never rests on colour or icon alone */
    children: ReactNode
    /* optional leading icon, drawn at 14 px and hidden from screen readers */
    icon?: ReactNode
  }

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {icon ? <span aria-hidden className="contents">{icon}</span> : null}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
export type { BadgeProps }
