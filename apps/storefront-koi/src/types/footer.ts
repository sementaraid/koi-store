import type { ComponentType } from "react"

export type FooterLink = {
  label: string
  href: string
}

export type FooterColumn = {
  label: string
  links: FooterLink[]
}

export type FooterTrust = {
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  tone?: "info" | "gold"
}
