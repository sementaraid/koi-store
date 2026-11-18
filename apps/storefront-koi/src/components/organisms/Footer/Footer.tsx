import { Fragment, type ComponentProps } from "react"
import { cn } from "cn"

import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
import { BrandMark } from "@/components/cells/BrandMark/BrandMark"
import { DEFAULT_BRAND_ICON } from "@/const/header"
import {
  DEFAULT_BRAND_NAME,
  DEFAULT_BRAND_SUBTITLE,
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_FOOTER_LEGAL_LINKS,
  DEFAULT_FOOTER_TAGLINE,
  DEFAULT_FOOTER_TRUST,
} from "@/const/footer"
import { RenderIf } from "@koi/ui"
import type {
  FooterColumn,
  FooterLink,
  FooterTrust,
} from "@/types/footer"

export type FooterProps = ComponentProps<"footer"> & {
  brandIcon?: string
  brandName?: string
  brandSubtitle?: string
  tagline?: string
  trust?: FooterTrust[]
  columns?: FooterColumn[]
  copyright?: string
  legalLinks?: FooterLink[]
}

export type * from "@/types/footer"

export function Footer({
  brandIcon = DEFAULT_BRAND_ICON,
  brandName = DEFAULT_BRAND_NAME,
  brandSubtitle = DEFAULT_BRAND_SUBTITLE,
  tagline = DEFAULT_FOOTER_TAGLINE,
  trust = DEFAULT_FOOTER_TRUST,
  columns = DEFAULT_FOOTER_COLUMNS,
  copyright,
  legalLinks = DEFAULT_FOOTER_LEGAL_LINKS,
  className,
  ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn(
        "w-full border-t border-border bg-card text-foreground",
        className
      )}
      {...props}
    >
      <div className={cn(CONTAINER, "py-10")}>
        <div className="grid grid-cols-1 gap-8 border-b border-border pb-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="flex items-center gap-3">
              <BrandMark brandIcon={brandIcon} brandHref="/" />
              <div className="flex flex-col">
                <span className="text-[17px] leading-tight font-extrabold tracking-tight uppercase">
                  {brandName}
                </span>
                <span className="text-2xs font-bold tracking-widest text-accent-ink uppercase">
                  {brandSubtitle}
                </span>
              </div>
            </div>

            <RenderIf when={tagline}>
              {(text) => (
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                  {text}
                </p>
              )}
            </RenderIf>

            <RenderIf when={trust.length ? trust : null}>
              {(pills) => (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {pills.map((pill) => (
                    <TrustPill key={pill.label} {...pill} />
                  ))}
                </div>
              )}
            </RenderIf>
          </div>

          <nav
            aria-label="Tautan footer"
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-8 lg:grid-cols-8"
          >
            {columns.map((column, index) => (
              <FooterColumnList
                key={column.label}
                {...column}
                className={
                  columns.length === 1
                    ? "lg:col-span-8"
                    : index === columns.length - 1
                      ? "lg:col-span-2"
                      : "lg:col-span-3"
                }
              />
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 md:flex-row">
          <p className="text-center text-xs text-muted-foreground md:text-left">
            {copyright ?? `© ${new Date().getFullYear()} ${brandName}`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            {legalLinks.map((link, index) => (
              <Fragment key={link.href}>
                <RenderIf when={index > 0}>
                  {() => (
                    <span aria-hidden className="text-border">
                      •
                    </span>
                  )}
                </RenderIf>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-accent-ink"
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumnList({
  label,
  links,
  className,
}: FooterColumn & { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-xs font-bold tracking-wider uppercase">{label}</h2>
      <ul className="flex flex-col gap-2">
        {links.map(({ label: text, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-xs text-muted-foreground transition-colors hover:text-accent-ink"
            >
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TrustPill({ label, icon: Icon, tone = "info" }: FooterTrust) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5">
      <Icon
        aria-hidden
        className={cn(
          "size-4",
          tone === "gold" ? "text-gold-ink" : "text-info-ink"
        )}
      />
      <span
        className={cn(
          "text-[11px] font-bold",
          tone === "gold" ? "text-gold-ink" : "text-info-ink"
        )}
      >
        {label}
      </span>
    </div>
  )
}
