/**
 * Format an auction price as Rupiah.
 *
 * The locale is pinned to `id-ID` rather than left to the visitor's browser:
 * a koi house quotes one price to everyone, and a visitor on an en-US browser
 * would otherwise see "IDR 12,500,000" next to a bidder seeing "Rp 12.500.000".
 *
 * @param amount - Price in major units (not cents/sen).
 * @param currency - ISO 4217 code. Defaults to `IDR`.
 *
 * @example
 * formatPrice(12_500_000)      // "Rp 12.500.000"
 * formatPrice(12_500_000.5)    // "Rp 12.500.000,50"
 */
export function formatPrice(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    /* Whole Rupiah is the norm, so a .00 tail is noise; keep the decimals only
       for the half-million-and-a-bit amounts that actually carry them. */
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

/**
 * The same amount, shortened to the Rupiah's own scale words: `"Rp 28,5 jt"`,
 * `"Rp 500 rb"`.
 *
 * For a chip that names an increment — "+ Rp 500.000" is wider than the button
 * holding it, and the full figure is already on the board an inch above.
 *
 * @param amount - Amount in major units.
 * @param currency - ISO 4217 code. Defaults to `IDR`.
 *
 * @example
 * formatPriceCompact(2_500_000)   // "Rp 2,5 jt"
 * formatPriceCompact(500_000)     // "Rp 500 rb"
 *
 * @remarks
 * ponytail: the breakpoints come from `Intl`'s `id-ID` compact rules, which
 * round at a third significant digit (`2_500_000` → `"Rp 3 jt"` without the
 * forced decimal). Fine for a chip; anything that must be read exactly wants
 * {@link formatPrice}.
 */
export function formatPriceCompact(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    notation: "compact",
    /* One decimal, always: it is what keeps `2.5` from rounding to `3`. */
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount)
}
