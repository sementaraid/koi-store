import type { ReactNode } from 'react';
import { cn } from 'cn';

import { Skeleton } from '@koi/ui';
import { BID_SAYA_CONTENT, CONTAINER } from '@/const/layout';

import { LoadingRegion } from './LoadingPages';

/*
 * Loading skeletons for the customer account routes under (account)/akun
 * (US-107 AC9-AC11). `AccountSkeleton` repeats AccountFrame's boxes (US-103
 * AC10): the menu column on the left (lg), and in the content column the small
 * title row above the content. A route's `loading.tsx` and the `fallback` of
 * its `<Suspense>` render the same skeleton.
 */

// One menu tile (AccountNav: min-h-20). Eight account pages, then the divider
// and the farm and sign-out tiles (US-103 AC10).
function MenuRows() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-control" />
        ))}
      </div>
      <Skeleton className="mx-3 my-2 h-px w-[calc(100%-1.5rem)]" />
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-control" />
        ))}
      </div>
    </>
  );
}

export function AccountSkeleton({
  label,
  menu = false,
  contentClassName,
  children
}: {
  label: string;
  /** The menu list below the content on mobile (the account home only). */
  menu?: boolean;
  /** Extra classes for the content column, matching the page's AccountFrame. */
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <LoadingRegion label={label}>
      <div
        className={cn(
          CONTAINER,
          'grid gap-8 py-8 sm:py-10 lg:grid-cols-[232px_minmax(0,1fr)] lg:items-start lg:gap-10'
        )}
      >
        <aside className="hidden lg:block">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-3 pb-2">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <MenuRows />
          </div>
        </aside>

        <div className={cn('flex min-w-0 flex-col gap-6', contentClassName)}>
          <Skeleton className="h-8 w-40" />
          {children}

          {menu ? (
            <section className="flex flex-col gap-3 lg:hidden">
              <Skeleton className="mx-3 h-6 w-28" />
              <div className="rounded-xl border border-border bg-card p-2">
                <MenuRows />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </LoadingRegion>
  );
}

// A card of list rows (orders, lots, reviews, ledger): thumb, two text lines, a short value.
export function RowsCard({
  className,
  rows = 3,
  thumb = true
}: {
  className: string;
  rows?: number;
  /** The farm lists have no photo for an auction row. */
  thumb?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card px-5',
        className
      )}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-0 flex-1 items-center gap-4 py-3">
          {thumb ? <Skeleton className="h-[60px] w-[48px] shrink-0 rounded-xl" /> : null}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// A form card: label above a field, repeated, then the submit button.
export function FormCard({ className, fields = 4 }: { className: string; fields?: number }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 overflow-hidden rounded-xl border border-border bg-card p-5',
        className
      )}
    >
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-40" />
    </div>
  );
}

// A card with a label and one big figure (wallet balance, how-to-top-up).
export function SummaryCard({ className }: { className: string }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-5',
        className
      )}
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-48" />
    </div>
  );
}

// A titled block: the section heading, then a card of rows.
function SectionBlock({ className, rows }: { className: string; rows: number }) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <Skeleton className="h-6 w-44 shrink-0" />
      <RowsCard className="min-h-0 flex-1" rows={rows} />
    </section>
  );
}

export function AccountHomeSkeleton() {
  return (
    <AccountSkeleton label="Memuat akun…" menu>
      <SectionBlock className="h-[365px] lg:h-[357px]" rows={3} />
      <SectionBlock className="h-[322px] lg:h-[153px]" rows={1} />
    </AccountSkeleton>
  );
}

export function AddressesSkeleton() {
  return (
    <AccountSkeleton label="Memuat alamat…">
      <RowsCard className="h-[198px]" rows={2} />
    </AccountSkeleton>
  );
}

// One won card: the photo, the title/seller/price stack, the four-step ladder
// and the action footer, at the same box sizes as WonCard so the list does not
// jump when the data lands (US-107 AC11).
function WonCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-card-edge bg-card p-4 shadow-card lg:gap-5 lg:p-5">
      <div className="flex min-w-0 gap-3 lg:gap-5">
        <Skeleton className="h-[66px] w-[88px] shrink-0 rounded-xl lg:h-[120px] lg:w-40" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-0.5 h-6 w-2/3 lg:h-7" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-5 w-28 lg:h-7" />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="flex items-center gap-3 lg:flex-col lg:items-stretch lg:gap-2">
            <Skeleton className="size-4 shrink-0 rounded-full lg:hidden" />
            <Skeleton className="hidden h-1 w-full rounded-full lg:block" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-divider pt-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-full sm:w-44" />
      </div>
    </div>
  );
}

// Bid Saya: two bid cards in the shape of the selected tab. The active and
// lost lists mirror ActiveBidCard's boxes (h3 24 px, text-sm 20 px, chip 24 px,
// two dl rows of 20 px); the won list mirrors WonCard.
function BidCardsSkeleton({ shape = 'active' }: { shape?: 'active' | 'won' }) {
  if (shape === 'won') {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1].map((key) => (
          <WonCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="flex flex-col gap-4 rounded-control border border-divider bg-background p-4 sm:flex-row sm:items-start"
        >
          <div className="flex min-w-0 flex-1 gap-3">
            <Skeleton className="h-16 w-20 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-1 h-6 w-40 max-w-full rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:w-64 sm:shrink-0">
            <div className="flex flex-col">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex flex-col">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="col-span-2 flex flex-col">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// The route's loading.tsx: the title row's tab strip, then the cards.
export function BidSayaListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full gap-1 rounded-control bg-muted p-1 sm:w-fit">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-11 flex-1 rounded-control sm:w-24" />
        ))}
      </div>
      <BidCardsSkeleton />
    </div>
  );
}

// The in-page fallback: the tabs already sit in the title row, so only the
// cards are missing. The Menang tab gets the won card's taller shape.
export function BidSayaSkeleton({ shape = 'active' }: { shape?: 'active' | 'won' }) {
  return (
    <LoadingRegion label="Memuat bid…">
      <BidCardsSkeleton shape={shape} />
    </LoadingRegion>
  );
}

export function BidSayaRouteSkeleton() {
  return (
    <AccountSkeleton label="Memuat bid…" contentClassName={BID_SAYA_CONTENT}>
      <BidSayaListSkeleton />
    </AccountSkeleton>
  );
}

export function SettingsSkeleton() {
  return (
    <AccountSkeleton label="Memuat pengaturan…">
      <FormCard className="h-[532px] lg:h-[409px]" fields={5} />
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-[176px] w-full rounded-xl lg:h-[180px]" />
    </AccountSkeleton>
  );
}

export function OrdersSkeleton() {
  return (
    <AccountSkeleton label="Memuat pesanan…">
      <RowsCard className="h-[308px] lg:h-[300px]" rows={3} />
    </AccountSkeleton>
  );
}

// One parcel card and the total card. Heights are estimated: no seed customer has an order.
export function OrderDetailSkeleton() {
  return (
    <AccountSkeleton label="Memuat pesanan…">
      <RowsCard className="h-[200px]" rows={1} />
      <Skeleton className="h-[68px] w-full rounded-xl" />
    </AccountSkeleton>
  );
}

export function WalletSkeleton() {
  return (
    <AccountSkeleton label="Memuat saldo…">
      <SummaryCard className="h-[118px]" />
      <RowsCard className="h-[260px] lg:h-[237px]" rows={4} />
    </AccountSkeleton>
  );
}

// Balance card, the left card with steps 1 and 3, the right card with step 2,
// then the history table. Heights follow the loaded page closely enough that
// the footer does not move when it swaps.
export function TopupSkeleton() {
  return (
    <AccountSkeleton label="Memuat top-up…">
      <SummaryCard className="h-[118px]" />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <FormCard className="h-[652px]" fields={4} />
        <FormCard className="h-[392px]" fields={2} />
      </div>
      <RowsCard className="h-[260px]" rows={3} />
    </AccountSkeleton>
  );
}

export function ReviewsSkeleton() {
  return (
    <AccountSkeleton label="Memuat ulasan…">
      <RowsCard className="h-[260px]" rows={2} />
    </AccountSkeleton>
  );
}

// Farm area (US-107 T-107.7). Create and edit heights were measured on the loaded forms at 390
// and 1440 px. The farm status card and the two farm lists depend on the seller's data, so
// those heights are estimates for a typical seller (not measured: farmer sign-in was blocked).
export function FarmSkeleton() {
  return (
    <AccountSkeleton label="Memuat farm…">
      <SummaryCard className="h-[360px]" />
    </AccountSkeleton>
  );
}

export function FarmHomeSkeleton() {
  return (
    <AccountSkeleton label="Memuat area peternak…">
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-[68px] w-full sm:h-8 sm:w-96" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>
        <RowsCard className="h-[232px]" rows={3} thumb={false} />
      </div>
    </AccountSkeleton>
  );
}

export function CreateAuctionSkeleton() {
  return (
    <AccountSkeleton label="Memuat form lelang…">
      <div className="grid gap-6">
        <FormCard className="h-[594px] sm:h-[402px]" fields={4} />
        <FormCard className="h-[550px] sm:h-[430px]" fields={4} />
        <Skeleton className="h-12 w-full sm:h-10 sm:w-48" />
        <Skeleton className="h-12 w-full sm:h-10 sm:w-48" />
      </div>
    </AccountSkeleton>
  );
}

export function EditAuctionSkeleton() {
  return (
    <AccountSkeleton label="Memuat lelang…">
      <FormCard className="h-[310px] sm:h-[254px]" fields={2} />
      <SummaryCard className="h-[254px] sm:h-[206px]" />
      <RowsCard className="h-[259px] sm:h-[163px]" rows={2} thumb={false} />
      <FormCard className="h-[638px] sm:h-[510px]" fields={4} />
      <FormCard className="h-[432px] sm:h-[300px]" fields={3} />
      <SummaryCard className="h-[214px] sm:h-[166px]" />
    </AccountSkeleton>
  );
}

export function SoldLotsSkeleton() {
  return (
    <AccountSkeleton label="Memuat lot terjual…">
      <RowsCard className="h-[450px]" rows={3} />
    </AccountSkeleton>
  );
}
