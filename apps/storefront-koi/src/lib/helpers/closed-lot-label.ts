/* US-040 AC3 (D-046): a closed lot's card reads the final price and whether it
   sold, never a live "Bid". `sold` is set only on a closed lot — the adapter's
   own contract (`lib/adapters/lot.ts`), so `undefined` means still open.
   Wording copied from the lot page (`LotPage.tsx`: "Harga akhir", "Terjual",
   "Tidak terjual"). */

export type ClosedLotLabel = {
  priceLabel: string
  statusLabel: string
}

/** The card's labels for a closed lot, or `undefined` when it is still open. */
export function closedLotLabel(sold?: boolean): ClosedLotLabel | undefined {
  if (sold === undefined) return undefined
  return {
    priceLabel: 'Harga akhir',
    statusLabel: sold ? 'Terjual' : 'Tidak terjual',
  }
}
