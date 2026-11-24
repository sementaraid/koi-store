import type { ComponentProps, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* koi alert: a flat box on `bg-surface` with a 1 px edge and an icon + title +
   text. Tone is never colour alone: the icon and title carry it too. Pass
   `role="status"` for a live announcement, `role="alert"` for an error that
   must interrupt; no role (the default) is for static notes. The icon is 20 px. */
const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-control border bg-surface p-4 text-sm text-foreground [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-border [&_svg]:text-muted-foreground",
        signal: "border-signal [&_svg]:text-signal",
        success: "border-success [&_svg]:text-success",
        warning: "border-warning [&_svg]:text-warning",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

type AlertProps = Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & {
    /* leading icon, drawn at 20 px and hidden from screen readers */
    icon?: ReactNode
    title: ReactNode
  }

function Alert({
  className,
  tone,
  icon,
  title,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon ? <span aria-hidden className="contents">{icon}</span> : null}
      <div className="flex min-w-0 flex-col gap-1">
        <p data-slot="alert-title" className="font-semibold">
          {title}
        </p>
        {children ? (
          <div
            data-slot="alert-description"
            className="text-muted-foreground [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-4"
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Alert, alertVariants }
export type { AlertProps }
