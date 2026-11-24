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
    <div data-slot="auction-tabs" className="bg-primary/5">
      <nav aria-label="Status lelang" className={cn(CONTAINER, "flex gap-1 overflow-x-auto py-2")}>
        {AUCTION_TABS.map((tab) => (
          <Link
            key={tab}
            href={auctionsTabHref(tab)}
            aria-current={tab === active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-control px-3 text-sm font-medium whitespace-nowrap text-accent-ink/70 tabular-nums hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-ring",
              tab === active && "bg-background font-semibold text-accent-ink shadow-xs"
            )}
          >
            {tabLabel(tab, counts[tab])}
          </Link>
        ))}
      </nav>
    </div>
  )
}
