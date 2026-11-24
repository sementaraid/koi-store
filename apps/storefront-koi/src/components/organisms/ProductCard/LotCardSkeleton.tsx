import { Skeleton } from "@koi/ui"

// Same box as AuctionProductCard: photo, title and farm line, price, time.
export function LotCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-control border border-divider bg-background">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-auto flex flex-col gap-2 border-t border-divider pt-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}
