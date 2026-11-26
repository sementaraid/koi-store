import { cn } from "cn"

import { Link } from "@/components/atoms/Link/Link"
import { auctionsTabHref } from "@/const/routes"
import { AUCTION_TABS, tabLabel, type AuctionTab } from "@/lib/helpers/auction-list"

// Links, not client state: the tab is the `status` search param, so the list is
// a server render and a tab can be opened in a new window. Counts are left out
// while they load (the skeleton state) or when their request failed.
export function AuctionTabs({
  active,
  counts = {},
}: {
  active: AuctionTab
  counts?: Partial<Record<AuctionTab, number>>
}) {
  const dotTone: Record<AuctionTab, string> = {
    live: "bg-signal",
    upcoming: "bg-warning",
    ended: "bg-muted-foreground",
  }

  return (
    // The same segmented control as /katalog and /toko (FilterBar's
    // `segment` tabs), drawn with links so the tab stays a URL.
    <nav
      aria-label="Status lelang"
      className="flex max-w-full gap-1 overflow-x-auto rounded-field bg-track p-1 max-sm:w-full sm:w-auto"
    >
      {AUCTION_TABS.map((tab) => {
        const current = tab === active
        return (
          <Link
            key={tab}
            href={auctionsTabHref(tab)}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground tabular-nums outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 max-sm:flex-1 max-sm:text-[13px] sm:h-9 sm:px-4",
              current && "bg-background font-semibold text-accent-ink shadow-segment"
            )}
          >
            {/* Status is never colour alone: the active tab keeps its label and
                gains a dot (US-097 AC15). */}
            {current ? (
              <span
                aria-hidden
                data-slot="tab-dot"
                className={cn("size-2 rounded-full", dotTone[tab])}
              />
            ) : null}
            {tabLabel(tab, counts[tab])}
          </Link>
        )
      })}
    </nav>
  )
}
