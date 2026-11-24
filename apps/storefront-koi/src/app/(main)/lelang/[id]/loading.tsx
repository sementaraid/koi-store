import { Skeleton } from '@koi/ui';

import { CONTAINER } from '@/const/layout';

// Skeleton of the gallery and the bid panel while the lot loads (AC9).
export default function LotLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className={CONTAINER}>
      <span className="sr-only">Memuat lot…</span>
      <div className="grid grid-cols-1 gap-10 pt-5 pb-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-4/3 w-full" />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}
