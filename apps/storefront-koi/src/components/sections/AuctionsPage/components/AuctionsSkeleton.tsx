import { FeedGrid } from "@/components/atoms/FeedGrid/FeedGrid"
import { CONTAINER } from "@/const/layout"
import { LotCardSkeleton } from "@/components/organisms/ProductCard/LotCardSkeleton"

export function AuctionsSkeleton() {
  return (
    <div role="status" aria-busy="true" className={`${CONTAINER} py-8 lg:py-10`}>
      <span className="sr-only">Memuat lot</span>
      <FeedGrid>
        {Array.from({ length: 4 }, (_, i) => (
          <LotCardSkeleton key={i} />
        ))}
      </FeedGrid>
    </div>
  )
}
