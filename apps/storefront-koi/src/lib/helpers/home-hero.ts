import type { StoreLot, StoreLotsPage } from "../data/lots.ts"

// A lot is open when its auction is live, nobody has closed or cancelled it and
// its end time is still ahead. Only an open lot can carry a bid action.
export const isOpenLot = (lot: StoreLot, now: number) =>
  lot.auction.status === "live" &&
  !lot.cancelled &&
  lot.sold === null &&
  Date.parse(lot.end_time) > now

// The hero is the open lot that ends first. `failed` keeps "the request broke"
// apart from "no open lot", so the page never shows a false empty state.
export function pickHome(page: Pick<StoreLotsPage, "lots" | "failed">, now: number) {
  const open = page.lots
    .filter((lot) => isOpenLot(lot, now))
    .sort((a, b) => Date.parse(a.end_time) - Date.parse(b.end_time))

  return { featured: open[0], rest: open.slice(1), failed: page.failed === true }
}
