import { cn } from "cn"

import { Link } from "@/components/atoms/Link/Link"
import { CONTAINER } from "@/const/layout"
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
  return (
    // The same segmented control as /katalog and /toko (FilterBar's
    // `segment` tabs), drawn with links so the tab stays a URL.
    <div data-slot="auction-tabs" className={cn(CONTAINER, "pt-6")}>
      <nav
        aria-label="Status lelang"
        className="flex max-w-full gap-1 overflow-x-auto rounded-field bg-track p-1 max-sm:w-full sm:inline-flex"
      >
        {AUCTION_TABS.map((tab) => (
          <Link
            key={tab}
            href={auctionsTabHref(tab)}
            aria-current={tab === active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-muted-foreground tabular-nums outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 max-sm:flex-1 sm:px-4",
              tab === active && "bg-background font-semibold text-accent-ink shadow-segment"
            )}
          >
            {tabLabel(tab, counts[tab])}
          </Link>
        ))}
      </nav>
    </div>
  )
}
