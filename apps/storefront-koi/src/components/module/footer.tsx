import { Fragment, type ComponentProps } from "react"
import { cn } from "cn"

import { Link } from "@/components/koi/link"
import { CONTAINER } from "@/components/constant/layout"
import { BrandMark } from "./brand-mark"
import { DEFAULT_BRAND_ICON } from "@/components/constant/header"
import {
  DEFAULT_BRAND_NAME,
  DEFAULT_BRAND_SUBTITLE,
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_FOOTER_LEGAL_LINKS,
  DEFAULT_FOOTER_TAGLINE,
  DEFAULT_FOOTER_TRUST,
} from "@/components/constant/footer"
import { RenderIf } from "@/components/module/render-if"
import type {
  FooterColumn,
  FooterLink,
  FooterTrust,
} from "@/components/types/footer"

/** Props for {@link Footer}: the lockup's copy, the link columns, and whatever
    the caller wants on the element itself. */
export type FooterProps = ComponentProps<"footer"> & {
  /** Logo image. Omitted, the fallback glyph stands in. */
  brandIcon?: string
  /** Brand name, beside the mark. @defaultValue `"Indokoi"` */
  brandName?: string
  /** Second lockup line, under the name — what the house does one word wide.
      @defaultValue `"Portal Lelang Koi"` */
  brandSubtitle?: string
  /** One line under the lockup — what the house is, in a sentence. */
  tagline?: string
  /** Claims shown as pills under the tagline. @defaultValue the kit's two */
  trust?: FooterTrust[]
  /** Link columns. @defaultValue the kit's three */
  columns?: FooterColumn[]
  /** Bottom-bar rights line. @defaultValue the current year and `brandName` */
  copyright?: string
  /** Bottom-bar legal row, drawn `•`-separated. @defaultValue the kit's four */
  legalLinks?: FooterLink[]
}

export type * from "@/components/types/footer"

/**
 * Site footer for the Indokoi auction shell — the header's counterpart, closing
 * the page on the same hairline it opens with.
 *
 * - **Top** — the brand lockup, its sentence and its two claims in a four-wide
 *   block; the three link columns take the rest, on a twelve-column grid.
 * - **Bottom** — a hairline, the rights line, and the legal row.
 *
 * Presentation only: it does not fetch, route or bid.
 *
 * @remarks
 * A plain `<footer>` in the flow, not a fixed bar — the page's own content
 * decides how soon it arrives. Nothing is dropped on a phone: the grid folds to
 * one column and the bottom row stacks, so every destination survives.
 *
 * @example
 * <Footer
 *   tagline="Rumah lelang koi sejak 2014."
 *   columns={[{ label: "Bantuan", links: [{ label: "Kontak", href: "/kontak" }] }]}
 * />
 */
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
              {/* The name and its subtitle are set here rather than inside the
                  mark: the mark is the photo, and the header already draws it
                  alone. */}
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

          {/* One landmark for the whole link area, with a heading per column:
              it is one footer's worth of destinations, not three navs. */}
          <nav
            aria-label="Tautan footer"
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:col-span-8 lg:grid-cols-8"
          >
            {columns.map((column, index) => (
              <FooterColumnList
                key={column.label}
                {...column}
                /* The three columns split the eight tracks 3 / 3 / 2, as the
                   design sets them — the trailing heading is the short one. A
                   lone column takes the whole band. */
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
                {index > 0 && (
                  <span aria-hidden className="text-border">
                    •
                  </span>
                )}
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

/** One column: the heading states what the rows below it are, so they need no
    landmark of their own. */
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
            {/* Resting at the muted tone and lifting to the brand accent under
                the pointer — the same rule the header's labels follow. */}
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

/** One claim under the tagline. A flat statement, so it carries the badge's
    restraint: a hairline and a tint, no lift. */
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
