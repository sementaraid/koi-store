import type { ComponentType } from "react"

export type HeaderBrand = {
  brandIcon?: string
  brandHref?: string
}

export type HeaderLink = {
  label: string
  href: string
  live?: boolean
}

export type HeaderBack = {
  label?: string
  href?: string
  onClick?: () => void
}

export type HeaderCart = {
  href?: string
  count?: number
}

export type HeaderAccountLink = {
  label: string
  href: string
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  variant?: "default" | "destructive"
  group?: string
}

export type HeaderAccount = {
  user: {
    name: string
    role?: string
    avatar?: string
  }
  /* whole rupiah, shown as a chip that links to top-up */
  balance?: number
  menu?: HeaderAccountLink[]
}
