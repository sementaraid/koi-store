import type { ComponentType } from "react"

/**
 * The bar's vocabulary: the shapes every piece of the header — and the pages
 * that wire it — agree on.
 *
 * @remarks
 * Nothing here has a DOM element or a component of its own: a nav entry, a back
 * destination, the account block, the brand lockup and the search pair are all
 * passed *between* modules. The props of `Header` itself live beside it in
 * `organisms/Header/Header.tsx`, because they are that one component's interface.
 */

/** The brand lockup: the mark's image, and where it points. Shared by the
    header, the footer, and `BrandMark` itself, so the three cannot drift. */
export type HeaderBrand = {
  /** Logo image. Omitted, the fallback glyph stands in. */
  brandIcon?: string
  /** Where the logo links. @defaultValue `"/"` */
  brandHref?: string
}

/** The search box: what it asks for, and where a submitted query goes. Shared
    by the header and `SearchField` itself. */
export type HeaderSearch = {
  /** Called with the trimmed query. Omit to let the form do a native GET submit. */
  onSearch?: (query: string) => void
  /** @defaultValue `"Cari varietas, sertifikat, breeder…"` */
  searchPlaceholder?: string
}

/** One entry in the header's nav. */
export type HeaderLink = {
  /** Visible text. */
  label: string
  /** Destination. */
  href: string
  /** Shows the live pulse. `Lelang Live` is the one that carries it. */
  live?: boolean
}

/** The bar's left slot when it is not the brand: a way out of the current page. */
export type HeaderBack = {
  /** Visible label, e.g. `"Katalog"`. Defaults to `"Kembali"`, which is also
      what a screen reader announces when the label is hidden on a phone. */
  label?: string
  /** Anchor when the destination is known. */
  href?: string
  /** Handler when it is not — usually `() => history.back()`. */
  onClick?: () => void
}

/**
 * The cart, as the bar shows it: the door, and how much is behind it.
 *
 * @remarks
 * A count only appears above zero. A badge reading `0` is a claim that the cart
 * was checked and is empty, drawn on every page of a site a visitor is mostly
 * browsing — so an empty cart is the word alone.
 */
export type HeaderCart = {
  /** Where the cart is. @defaultValue `"/keranjang"` */
  href?: string
  /** Items carried. `0` or omitted draws no count. */
  count?: number
}

/** One entry in the avatar's dropdown — the customer's own pages. */
export type HeaderAccountLink = {
  /** Visible text. */
  label: string
  /** Destination. */
  href: string
  /** Leading glyph. Any lucide-style component taking `className`. */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  /** Menu-item tone. `destructive` is sign-out. */
  variant?: "default" | "destructive"
  /** Heading the row sits under, e.g. `"Aktivitas"`. Rows sharing one are drawn
      as a section — in first-seen order, with a rule between sections. Omitted,
      the row drops to the trailing block under no heading, which is where
      sign-out belongs: it is not a page, it is the way out. */
  group?: string
}

/** Everything the bar knows about the signed-in customer. */
export type HeaderAccount = {
  user: {
    /** Full name. Also the source of the avatar's monogram fallback. */
    name: string
    /** Tier, e.g. `"VIP Kolektor"`. Shown in gold beside the name. */
    role?: string
    /** Avatar image. Omitted, the monogram stands in. */
    avatar?: string
  }
  /** Unread notifications. `0` or omitted renders no dot. */
  unread?: number
  /** Bell handler. The tab bar's Notifikasi entry uses it too, when the caller
      passes one to the bottom nav. */
  onNotificationsClick?: () => void
  /** Pages behind the avatar. Defaults to the kit's own four. */
  menu?: HeaderAccountLink[]
}
