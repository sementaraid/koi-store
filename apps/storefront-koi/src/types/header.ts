import type { ComponentType } from "react"

export type HeaderBrand = {
  brandIcon?: string
  brandHref?: string
}

export type HeaderSearch = {
  onSearch?: (query: string) => void
  searchPlaceholder?: string
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
  unread?: number
  onNotificationsClick?: () => void
  menu?: HeaderAccountLink[]
}
