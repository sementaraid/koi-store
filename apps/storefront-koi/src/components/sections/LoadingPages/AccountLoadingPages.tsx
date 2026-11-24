import type { ReactNode } from 'react';
import { cn } from 'cn';

import { Skeleton } from '@koi/ui';
import { CONTAINER } from '@/const/layout';

import { LoadingRegion, TrailSkeleton } from './LoadingPages';

/*
 * Loading skeletons for the customer account routes under (account)/akun
 * (US-107 AC9-AC11). `AccountSkeleton` repeats AccountFrame's boxes: the
 * breadcrumb strip, the page head, then the grid with the menu column (lg) and
 * the content column. Heights come from the loaded pages at 390 and 1440 px, so
 * the footer does not move when the content arrives. A route's `loading.tsx`
 * and the `fallback` of its `<Suspense>` render the same skeleton.
 */

// One menu row (AccountNav: min-h-11).
function MenuRows() {
  return (
    <>
      <div className="flex flex-col gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-[10px]" />
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-[10px]" />
        ))}
      </div>
    </>
  );
}

export function AccountSkeleton({
  label,
  head = 'h-[117px]',
  menu = false,
  children
}: {
  label: string;
  /** Height of the head block (the loaded head minus its py-8), per breakpoint. */
  head?: string;
  /** The menu list below the content on mobile (the account home only). */
  menu?: boolean;
  children: ReactNode;
}) {
  return (
    <LoadingRegion label={label}>
      <TrailSkeleton />
      <div className={cn(CONTAINER, 'py-8')}>
        <div className={cn('flex max-w-xl flex-col gap-3 overflow-hidden', head)}>
          <Skeleton className="h-[14px] w-24" />
          <Skeleton className="h-9 w-64 max-w-full sm:h-10 lg:h-12" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>

      <div className="border-t border-border bg-muted/40">
        <div
          className={cn(
            CONTAINER,
            'grid gap-8 py-8 sm:py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10'
          )}
        >
          <aside className="hidden lg:block">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div>
                <MenuRows />
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-10">
            {children}

            {menu ? (
              <section className="flex flex-col gap-3 lg:hidden">
                <Skeleton className="mx-3 h-6 w-28" />
                <div className="h-[598px] rounded-xl border border-border bg-card p-2">
                  <MenuRows />
                </div>
              </section>
            ) : null}
          </div>
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
    <AccountSkeleton label="Memuat akun…" head="h-[117px] lg:h-[140px]" menu>
      <SectionBlock className="h-[365px] lg:h-[357px]" rows={3} />
      <SectionBlock className="h-[322px] lg:h-[153px]" rows={1} />
    </AccountSkeleton>
  );
}

export function AddressesSkeleton() {
  return (
    <AccountSkeleton label="Memuat alamat…" head="h-[174px] lg:h-[117px]">
      <RowsCard className="h-[198px]" rows={2} />
    </AccountSkeleton>
  );
}

// Bid Saya: the tab strip and three bid cards (140 px, like a loaded card). The route's
// loading.tsx and the tab change in BidSayaPage both render this list.
export function BidSayaListSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full gap-1 rounded-control bg-muted p-1 sm:w-fit">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-11 flex-1 rounded-control sm:w-24" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="flex min-h-[140px] gap-3 rounded-control border border-divider bg-background p-4"
          >
            <Skeleton className="h-16 w-20 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BidSayaSkeleton() {
  return (
    <LoadingRegion label="Memuat bid…">
      <BidSayaListSkeleton />
    </LoadingRegion>
  );
}

export function BidSayaRouteSkeleton() {
  return (
    <AccountSkeleton label="Memuat bid…" head="h-[94px] lg:h-[117px]">
      <BidSayaListSkeleton />
    </AccountSkeleton>
  );
}

export function WonLotsSkeleton() {
  return (
    <AccountSkeleton label="Memuat lot yang dimenangkan…">
      <RowsCard className="h-[269px] lg:h-[175px]" rows={1} />
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

export function MessagesSkeleton() {
  return (
    <AccountSkeleton label="Memuat pesan…" head="h-[94px] lg:h-[117px]">
      <RowsCard className="h-[237px]" rows={3} />
    </AccountSkeleton>
  );
}

export function OrdersSkeleton() {
  return (
    <AccountSkeleton label="Memuat pesanan…" head="h-[117px] lg:h-[140px]">
      <RowsCard className="h-[308px] lg:h-[300px]" rows={3} />
    </AccountSkeleton>
  );
}

// One parcel card and the total card. Heights are estimated: no seed customer has an order.
export function OrderDetailSkeleton() {
  return (
    <AccountSkeleton label="Memuat pesanan…" head="h-[94px]">
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

export function TopupSkeleton() {
  return (
    <AccountSkeleton label="Memuat top-up…" head="h-[140px]">
      <SummaryCard className="h-[154px]" />
      <FormCard className="h-[392px] lg:h-[328px]" fields={2} />
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
    <AccountSkeleton label="Memuat kebun…">
      <SummaryCard className="h-[360px]" />
    </AccountSkeleton>
  );
}

export function FarmHomeSkeleton() {
  return (
    <AccountSkeleton label="Memuat area petani…" head="h-[94px] lg:h-[117px]">
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
    <AccountSkeleton label="Memuat lelang…" head="h-[181px] lg:h-[117px]">
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
