import type { ReactNode } from 'react';

import { Skeleton } from '@koi/ui';
import { FeedGrid } from '@/components/atoms/FeedGrid/FeedGrid';
import { LotLayout } from '@/components/atoms/LotLayout/LotLayout';
import { LotCardSkeleton } from '@/components/organisms/ProductCard/LotCardSkeleton';
import { CONTAINER } from '@/const/layout';

/*
 * Loading skeletons for the (main) routes (US-107 AC9-AC11). Each one fills the
 * same boxes as the loaded page (same containers, grids and card ratios), so
 * the content replaces it without moving the header, nav or footer.
 * A route's `loading.tsx` and the `fallback` of its `<Suspense>` render the same one.
 */

// The region every skeleton sits in: busy, with a status for screen readers.
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// The breadcrumb strip at the top of a page's content (PageTrail: pt-5, one text-xs line).
export function TrailSkeleton() {
  return (
    <div className={`${CONTAINER} pt-5`}>
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

// Eyebrow, h1 and a two-line lede, the head of the plain list pages.
function PageHeadSkeleton() {
  return (
    <div className="mb-8 max-w-2xl">
      <Skeleton className="h-[14px] w-40" />
      <Skeleton className="mt-2 h-9 w-56 lg:h-10" />
      <Skeleton className="mt-2 h-[46px] w-full" />
    </div>
  );
}

// FeedHero: tinted band with eyebrow, h1, lede and the status badge.
function FeedHeroSkeleton() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className={`${CONTAINER} py-8 lg:py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex w-full max-w-xl flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-3/4 lg:h-10" />
            <Skeleton className="h-[102px] w-full sm:h-[68px] lg:h-[46px]" />
          </div>
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
      </div>
    </section>
  );
}

// FilterBar: status tabs on the left, two selects (label above) on the right.
function FilterBarSkeleton() {
  return (
    <div className="bg-primary/5">
      <div className={`${CONTAINER} flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between`}>
        <Skeleton className="h-[54px] w-full sm:h-9 sm:w-72" />
        <div className="flex items-end gap-3">
          <Skeleton className="h-[68px] flex-1 sm:h-[52px] sm:w-44 sm:flex-none" />
          <Skeleton className="h-[68px] flex-1 sm:h-[52px] sm:w-44 sm:flex-none" />
        </div>
      </div>
    </div>
  );
}

// SimpleProductCard: photo, title and seller, facts, price and the action.
export function ProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-control border border-divider bg-background">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-auto h-8 w-full" />
      </div>
    </div>
  );
}

// PartnerCard: initial and name, three facts, speciality and the visit button.
export function PartnerCardSkeleton() {
  return (
    <div className="flex h-[130px] w-full flex-col justify-between rounded-control border border-divider bg-background p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

function ShelfSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className={`${CONTAINER} py-8 lg:py-10`}>
      <Skeleton className="mb-6 h-4 w-48" />
      <FeedGrid>
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </FeedGrid>
    </section>
  );
}

// Home: hero with the featured lot card, then the open-lots shelf and the partner row.
export function HomeSkeleton() {
  return (
    <LoadingRegion label="Memuat beranda…">
      <section className={`${CONTAINER} py-10 lg:py-16`}>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-[113px] w-full max-w-xl sm:h-[96px] lg:h-[180px]" />
            <Skeleton className="h-[68px] w-full max-w-lg sm:h-[78px]" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-36" />
            </div>
            <Skeleton className="mt-2 h-11 w-64" />
          </div>
          <div className="w-full max-w-md justify-self-start lg:justify-self-end">
            <LotCardSkeleton />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className={`${CONTAINER} py-10 lg:py-14`}>
          <div className="mb-6 flex flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-72" />
          </div>
          <FeedGrid>
            {Array.from({ length: 4 }, (_, i) => (
              <LotCardSkeleton key={i} />
            ))}
          </FeedGrid>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className={`${CONTAINER} py-10 lg:py-14`}>
          <div className="mb-6 flex flex-col gap-1">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-8 w-80" />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <PartnerCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

// Katalog, kategori/[category] and toko: hero, filter bar, facet sidebar and a 3-column grid.
export function FeedPageSkeleton({ label, trail = false }: { label: string; trail?: boolean }) {
  return (
    <LoadingRegion label={label}>
      {trail ? <TrailSkeleton /> : null}
      <FeedHeroSkeleton />
      <FilterBarSkeleton />
      <div className={`${CONTAINER} grid gap-8 py-8 lg:grid-cols-4 lg:py-10`}>
        <aside className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1">
          <Skeleton className="col-span-2 h-4 w-16 lg:col-span-1" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </aside>
        <div className="min-w-0 lg:col-span-3">
          <Skeleton className="mb-6 h-5 w-40" />
          <FeedGrid cols={3}>
            {Array.from({ length: 6 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </FeedGrid>
        </div>
      </div>
    </LoadingRegion>
  );
}

// Eighteen cards, about today's category list, so the footer does not move when it arrives.
export function CategoriesSkeleton() {
  return (
    <LoadingRegion label="Memuat kategori…">
      <TrailSkeleton />
      <div className={`${CONTAINER} pt-5 pb-16`}>
        <PageHeadSkeleton />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 18 }, (_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-7 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

// Twelve cards so the skeleton is taller than a desktop screen: the footer stays below the fold
// and does not drop when the real, longer list arrives.
export function PartnersSkeleton() {
  return (
    <LoadingRegion label="Memuat mitra…">
      <TrailSkeleton />
      <div className={`${CONTAINER} pt-5 pb-16`}>
        <PageHeadSkeleton />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => (
            <PartnerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

// Partner profile: logo and name band, then the listings grid.
export function PartnerSkeleton() {
  return (
    <LoadingRegion label="Memuat mitra…">
      <TrailSkeleton />
      <section className="border-b border-border bg-muted/40">
        <div className={`${CONTAINER} py-8 lg:py-10`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <Skeleton className="size-14 shrink-0 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-[14px] w-32" />
                <Skeleton className="h-9 w-48 lg:h-10" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
          <Skeleton className="mt-6 h-[46px] w-full max-w-2xl" />
        </div>
      </section>
      <ShelfSkeleton />
    </LoadingRegion>
  );
}

// Product page: gallery and description beside the sale panel, then the shelf.
export function ProductSkeleton() {
  return (
    <LoadingRegion label="Memuat produk…">
      <TrailSkeleton />
      <LotLayout
        media={
          <>
            <Skeleton className="h-[334px] w-full lg:h-[578px]" />
            <Skeleton className="h-[231px] w-full lg:h-[212px]" />
          </>
        }
        aside={
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-[348px] w-full lg:h-[330px]" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-[220px] w-full" />
            <Skeleton className="h-[46px] w-full" />
          </>
        }
      />
      <ShelfSkeleton />
    </LoadingRegion>
  );
}

// Cart and shipping: title with the step bar, a column of rows and the sticky summary.
export function CheckoutSkeleton({ label, trail }: { label: string; trail: boolean }) {
  return (
    <LoadingRegion label={label}>
      {trail ? <TrailSkeleton /> : null}
      <div className={`${CONTAINER} pt-5 pb-16`}>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-48 lg:h-10" />
            <Skeleton className="h-[46px] w-72 max-w-full" />
          </div>
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <div className="flex flex-wrap items-start gap-12">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[92px] w-full" />
            ))}
          </div>
          <aside className="min-w-0 flex-[1_1_360px]">
            <Skeleton className="h-72 w-full" />
          </aside>
        </div>
      </div>
    </LoadingRegion>
  );
}

// Info article: eyebrow, title, lede and a few text sections in the 760 px column.
export function InfoSkeleton() {
  return (
    <LoadingRegion label="Memuat halaman…">
      <TrailSkeleton />
      <div className={`${CONTAINER} max-w-[760px] py-10 lg:py-14`}>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[14px] w-32" />
          <Skeleton className="h-8 w-3/4 sm:h-9" />
          <Skeleton className="h-[46px] w-full sm:h-[23px]" />
        </div>
        <div className="mt-10 flex flex-col gap-9">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-[168px] w-full sm:h-[76px]" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
