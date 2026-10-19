import type { ComponentProps } from "react"

import type { FeedShell } from "@/types/product"
import type { CartLine, CheckoutStep } from "@/types/cart"
import type { Settlement } from "@/lib/helpers/cart-totals"

/**
 * A price the visitor can pick, as an option the house offers.
 *
 * @remarks
 * One type for all three choosers — the address, the way a koi flies, and the
 * courier for everything else — because to a visitor they are the same act and
 * the same control: read a few lines, take one. Only what a line *says* differs,
 * and that is in `title` and `detail` rather than in a taxonomy.
 *
 * `id` is the caller's, and it is what the choice is reported back as — a string
 * rather than an index, because a price calculated from a position in an array
 * changes meaning the moment the array is reordered.
 *
 * @example
 * const options: ShippingOption[] = [
 *   { id: "air-cargo-door", title: "Kargo udara + antar ke alamat", detail: "Dijemput kurir di bandara, diantar ke rumah", price: 850_000, short: "antar ke alamat" },
 * ]
 */
export type ShippingOption = {
  id: string
  /** The line the visitor is really choosing between. */
  title: string
  /** What it means in practice — who carries it, where it is picked up, how long
      it takes. Omitted, the option is its title and its price. */
  detail?: string
  /** What it adds, in Rupiah. Omitted, the house has not priced it — drawn as
      an em dash rather than a `Rp 0` that would read as free. */
  price?: number
  /** This choice in a sentence, for the summary's row — as the address chooser
      has always done. Omitted, the summary falls back to `title`. */
  short?: string
}

/** Where a parcel can be sent. */
export type ShippingAddress = {
  id: string
  /** Who receives it, as the address is filed: `"Rumah — Bpk. Hendra"`. */
  name: string
  /** What kind of place it is — `"Utama"`, `"Farm"`. Omitted, the row carries no
      tag rather than an empty pill. */
  tag?: string
  /** The address itself, one line, already formatted for a label. */
  line: string
}

/**
 * What the visitor decided about one parcel, as their props state it.
 *
 * @remarks
 * A decision, not the options themselves: the page is handed the list the house
 * offers and the one the visitor took, and it is the page's job to find the
 * taken one in the list. That is the same shape every other prop in the kit
 * keeps — the caller holds the state, the component draws it — and it means a
 * visitor who has not chosen yet has simply left the field out, which the page
 * reads as the house's default rather than as an error.
 */
export type ShippingChoice = {
  /** Which option was taken. Omitted, the first one the house offers. */
  optionId?: string
}

/**
 * One shipment, priced or not.
 *
 * @remarks
 * The unit is a parcel, not an item: a breeder's two fish travel in one bag in
 * one box, and a sack of food does not travel with them at all. A page that
 * priced per line would quote a visitor three deliveries for one box.
 *
 * The parcel carries its own items rather than ids into the cart, because a
 * parcel has to stand on its own: it is drawn under its own heading, priced on
 * its own, and — in the rail — one row of a bill. Reaching back into the cart
 * for what is in it would make the parcel meaningless outside the page it was
 * built on.
 */
export type ShippingParcel = {
  /** The shipment itself, already assembled: which seller, which items, and
      what it costs to send. */
  key: string
  /** Who sends it. Omitted, the parcel is unnamed and reads by its contents. */
  seller?: string
  /** The items travelling together. Cart lines rather than bare products,
      because a parcel of fish food is two sacks and the count has to survive
      the regrouping. */
  items: CartLine[]
  /** How it goes: a live koi flies, shelf goods ride with a courier. Decided by
      the caller, because it is a fact about the fish, not about the choice. */
  mode: "live" | "courier"
  /** What the visitor may choose between. `"live"` parcels are the air-cargo
      options; `"courier"` ones are the courier services. */
  options: ShippingOption[]
  /** The one taken. */
  choice?: ShippingChoice
}

/**
 * Every parcel but one, as it stands.
 *
 * @remarks
 * This is what a `ShippingChoice` is actually reported against: the page cannot
 * know what a choice *means* — it does not price an air-cargo flight — so a
 * handler is handed the parcel's key and the option's id, and the app answers
 * with the shipment priced. Anything else would have the kit invent a tariff.
 */
export type ShippingSelection = {
  key: string
  optionId: string
}

/**
 * Props for {@link ShippingPage}.
 *
 * @remarks
 * Every prop is optional, so `<ShippingPage />` renders the kit's demo checkout
 * on its own — the same contract the cart and the dossiers keep, where the
 * constants file stands in until an API owns the data.
 *
 * The page holds only the state it cannot be handed: which schedule the visitor
 * picked and what they typed in the phone field. Everything a decision changes —
 * which address, which delivery, what it costs — comes back through the
 * handlers, because none of it can be settled without the app that owns the
 * order.
 */
export type ShippingPageProps = ComponentProps<"div"> &
  FeedShell & {
    /** What is being delivered, and the options for each shipment.
        @defaultValue the kit's demo order — one won lot and one bought koi
        flying, and stock off a shelf riding with a courier */
    parcels?: ShippingParcel[]
    /** Where it can go. @defaultValue the kit's two demo addresses */
    addresses?: ShippingAddress[]
    /** Which address was taken. Omitted, the first one. */
    addressId?: string
    /** The days the fish can arrive. Omitted, the house's next few — the kit's
        demo dates. */
    dates?: ShippingDate[]
    /** Which day the visitor picked. Omitted, the first one. */
    dateId?: string
    /** The receiving phone number, as typed. Omitted, the field is empty — a
        number the kit invented is a number the courier would ring. */
    phone?: string
    /** Called with the next phone number. Omitted, the field still types and
        reports nothing. */
    onPhoneChange?: (phone: string) => void
    /** Called with the address the visitor picked. */
    onAddressChange?: (address: ShippingAddress) => void
    /** Called with the day the visitor picked. */
    onDateChange?: (date: ShippingDate) => void
    /** Called with a parcel and the delivery option taken. */
    onChoiceChange?: (selection: ShippingSelection) => void
    /** What is being delivered, added up. @defaultValue `cartTotals(parcels)` */
    totals?: Settlement
    /** Called when the visitor commits to the last step. Omitted, the control
        still renders and does nothing — taking the money is the app's
        business. */
    onCheckout?: () => void
    /** Called when the visitor gives up and goes back. Omitted, the way back
        still renders and does nothing. */
    onBack?: () => void
    /** Called when the visitor asks to file another address. Omitted, no such
        control is drawn — the kit has no address book to send them to. */
    onAddAddress?: () => void
    /** Which step the indicator marks current. @defaultValue `"shipping"` */
    step?: CheckoutStep
    /** Which earlier steps the indicator draws as done, rather than numbering.
        Omitted, the cart is done — a visitor who is here has been through it. */
    completed?: CheckoutStep[]
  }

/**
 * A day a live parcel can arrive.
 *
 * @remarks
 * A day and its date are two fields rather than one formatted string, because
 * the picker draws them on two lines and typography is not the caller's job.
 * `id` is what a choice is reported as.
 */
export type ShippingDate = {
  id: string
  /** `"Jumat"`. */
  day: string
  /** `"16 Okt"`. */
  date: string
}
