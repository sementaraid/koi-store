import { Skeleton } from "@koi/ui"

// Same box as AuctionProductCard: photo, title and farm line, then price on the left and time on
// the right (board "Desktop · Memuat & kosong"). The body keeps a minimum height close to the
// loaded card's so the grid does not jump when the lots arrive.
export function LotCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-card border border-card-edge bg-background shadow-card">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex min-h-[150px] flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-divider pt-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}
