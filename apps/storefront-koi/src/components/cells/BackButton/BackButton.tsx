import type { ComponentProps } from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "cn"

import { Button } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import type { HeaderBack } from "@/types/header"

export type BackButtonProps = HeaderBack &
  Omit<ComponentProps<typeof Button>, "onClick">

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
