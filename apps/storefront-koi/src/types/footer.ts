import type { ComponentType } from "react"

/**
 * The footer's vocabulary: what one link, one column, and one trust pill are.
 *
 * @remarks
 * `Footer`'s own props live beside it in `organisms/Footer/Footer.tsx` — they are
 * that one component's interface. What stays here is the shapes a caller composes before
 * handing them over, which is why they are not nested in the props type.
 */

/** One destination under a footer heading. */
export type FooterLink = {
  /** Visible text. */
  label: string
  /** Destination. */
  href: string
}

/** One headed stack of links, e.g. `"Bantuan & Edukasi"`. Columns are drawn in
    the order given, so the caller's list order is the reading order. */
export type FooterColumn = {
  /** Heading the links sit under. */
  label: string
  /** The column's links, top to bottom. */
  links: FooterLink[]
}

/**
 * One trust pill under the tagline — a claim the house makes about itself, not a
 * destination.
 */
export type FooterTrust = {
  /** Visible text. Short: it sits in a pill. */
  label: string
  /** Any lucide-style component taking `className`. */
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  /**
   * Ink for the glyph and the label.
   * - `info` — a protection or a rule being met. Cool, factual.
   * - `gold` — an accreditation. Earned distinction.
   *
   * @defaultValue `"info"`
   */
  tone?: "info" | "gold"
}
