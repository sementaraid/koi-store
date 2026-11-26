import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { CONTAINER } from "@/const/layout"
import { LotCardSkeleton } from "@/components/organisms/ProductCard/LotCardSkeleton"
import type { AuctionTab } from "@/lib/helpers/auction-list"

import { AuctionFilters } from "./AuctionFilters"

export function AuctionsSkeleton({ tab }: { tab: AuctionTab }) {
  return (
    <div role="status" aria-busy="true" className={`${CONTAINER} py-8 lg:py-10`}>
      <span className="sr-only">Memuat lot</span>
      {/* Same two-column frame as the loaded page, so the sidebar and grid do
          not jump when the list arrives (US-097 AC13). */}
      <div className="grid gap-8 max-sm:gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AuctionFilters tab={tab} />
        <div className="min-w-0">
          <FeedGrid cols={3}>
            {Array.from({ length: 6 }, (_, i) => (
              <LotCardSkeleton key={i} />
            ))}
          </FeedGrid>
        </div>
      </div>
    </div>
  )
}
