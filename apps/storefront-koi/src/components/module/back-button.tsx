import type { ComponentProps } from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import type { HeaderBack } from "@/components/types/header"

/** {@link BackButton} props: the destination/handler pair plus the rest of the
    control's own, so a caller can widen it or hang a `data-*` on it. */
export type BackButtonProps = HeaderBack &
  Omit<ComponentProps<typeof Button>, "onClick">

/**
 * Back out of the current page. Icon-only on phones; the label reappears once
 * there is room for it beside the search field, and stays as the accessible
 * name either way.
 */
export function BackButton({
  label = "Kembali",
  href,
  onClick,
  className,
  variant = "ghost",
  size = "icon-md",
  ...control
}: BackButtonProps) {
  return (
    <Button
      onClick={onClick}
      /* an anchor when the destination is known, a plain button otherwise */
      render={href ? <Link href={href} /> : undefined}
      nativeButton={!href}
      variant={variant}
      size={size}
      aria-label={label}
      className={cn(
        "-ms-1.5 shrink-0 text-foreground hover:text-accent-ink sm:w-auto sm:gap-1.5 sm:px-3",
        className
      )}
      {...control}
    >
      <ArrowLeft aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
