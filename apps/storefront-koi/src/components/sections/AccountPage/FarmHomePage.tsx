import { ClientError } from '@mercurjs/client';
import { AlertTriangle, Gavel, LockKeyhole, PackageCheck, Plus, Sprout } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from 'cn';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  RenderIf
} from '@koi/ui';
import { Link } from '@/components/atoms';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { farmAuctionHref, farmHomeStatusHref, ROUTES } from '@/const/routes';
import { getMyAuctions, type AuctionListItem } from '@/lib/data/auctions';
import { getMyFarm, type FarmSeller } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import {
  AUCTION_STATUSES,
  auctionStatusLabel,
  isAuctionStatus,
  type AuctionStatus
} from '@/lib/helpers/auction-status';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { farmStatusInfo } from '@/lib/helpers/farm-status';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';
import { SubmitAuctionButton } from './components/SubmitAuctionButton';

const PER_PAGE = 20;

export type FarmHomePageProps = {
  searchParams: Promise<{ status?: string | string[]; page?: string | string[] }>;
};

export async function FarmHomePage({ searchParams }: FarmHomePageProps) {
  const [, { account, cart }, groups, params] = await Promise.all([
    requireCustomer(ROUTES.farmHome),
    getShell(),
    listOrderGroups(),
    searchParams
  ]);

  let seller: FarmSeller | null = null;
  let failed = false;

  try {
    seller = await getMyFarm();
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmHome)}`);
    }
    failed = true;
  }

  const approved = seller ? farmStatusInfo(seller).approved : false;

  const status = isAuctionStatus(params.status) ? params.status : undefined;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(Number.parseInt(rawPage ?? '1', 10) || 1, 1);

  let auctions: AuctionListItem[] = [];
  let count = 0;
  let auctionsFailed = false;
  if (approved) {
    try {
      const result = await getMyAuctions(PER_PAGE, (page - 1) * PER_PAGE, status);
      auctions = result.auctions;
      count = result.count;
    } catch {
      auctionsFailed = true;
    }
  }

  const body = failed ? (
    <Card className="border-destructive-ink/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
          Gagal memuat status kebun
        </CardTitle>
        <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  ) : approved ? (
    <MyAuctions
      auctions={auctions}
      failed={auctionsFailed}
      status={status}
      page={page}
      pageCount={Math.max(1, Math.ceil(count / PER_PAGE))}
    />
  ) : (
    <Closed seller={seller} />
  );

  return (
    <AccountFrame
      title="Area petani"
      eyebrow={
        <>
          <Sprout aria-hidden className="size-3.5" />
          Kebun
        </>
      }
      description="Tempat mengelola lelang dan lot Anda."
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    >
      {body}
    </AccountFrame>
  );
}

function Closed({ seller }: { seller: FarmSeller | null }): ReactNode {
  if (!seller) {
    return (
      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <LockKeyhole aria-hidden className="size-4 text-muted-foreground" />
            Area petani belum terbuka
          </CardTitle>
          <CardDescription>
            Akun ini belum punya kebun. Daftarkan kebun dulu; area petani terbuka setelah admin
            menyetujuinya.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Button
            render={<Link href={ROUTES.farm} />}
            nativeButton={false}
          >
            <Sprout aria-hidden />
            Daftarkan kebun
          </Button>
        </CardContent>
      </Card>
    );
  }

  const info = farmStatusInfo(seller);
  const reason = seller.status_reason?.trim();

  return (
    <Card className="px-5 py-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <LockKeyhole aria-hidden className="size-4 text-muted-foreground" />
          {info.title}
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-foreground">{info.body}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-0 pb-0 text-sm">
        <RenderIf when={info.reasonLabel ? reason : undefined}>
          {(why) => (
            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs font-bold text-foreground">{info.reasonLabel}</p>
              <p className="mt-1 text-sm text-foreground">{why}</p>
            </div>
          )}
        </RenderIf>
        <div>
          <Button
            variant="outline"
            render={<Link href={ROUTES.farm} />}
            nativeButton={false}
          >
            Lihat status kebun
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusTabs({ status }: { status?: AuctionStatus }) {
  const tabs: { value?: AuctionStatus; label: string }[] = [
    { value: undefined, label: 'Semua' },
    ...AUCTION_STATUSES.map((value) => ({ value, label: auctionStatusLabel(value).label }))
  ];

  return (
    <nav
      aria-label="Status lelang"
      className="flex flex-wrap gap-1 overflow-x-auto"
    >
      {tabs.map(({ value, label }) => {
        const active = value === status;
        return (
          <Link
            key={label}
            href={farmHomeStatusHref(value)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function MyAuctions({
  auctions,
  failed,
  status,
  page,
  pageCount
}: {
  auctions: AuctionListItem[];
  failed: boolean;
  status?: AuctionStatus;
  page: number;
  pageCount: number;
}): ReactNode {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusTabs status={status} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            render={<Link href={ROUTES.farmSold} />}
            nativeButton={false}
          >
            <PackageCheck aria-hidden />
            Lot terjual
          </Button>
          <Button
            render={<Link href={ROUTES.farmAuctionNew} />}
            nativeButton={false}
          >
            <Plus aria-hidden />
            Buat lelang
          </Button>
        </div>
      </div>

      <RenderIf when={failed}>
        {() => (
          <Card className="border-destructive-ink/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Gagal memuat daftar lelang
              </CardTitle>
              <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!failed && auctions.length ? auctions : null}>
        {(list) => (
          <>
            <Card className="px-5 py-1">
              {list.map((auction) => {
                const auctionStatus = auctionStatusLabel(auction.status);
                return (
                  <div
                    key={auction.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {auction.lot_count} lot
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDeadline(auction.start_at)} – {formatDeadline(auction.end_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={auctionStatus.tone}>{auctionStatus.label}</Badge>
                      <Link
                        href={farmAuctionHref(auction.id)}
                        className="text-sm font-medium text-accent-ink hover:underline"
                      >
                        {auction.status === 'draft' ? 'Ubah' : 'Lihat'}
                      </Link>
                    </div>
                    <RenderIf when={auction.status === 'draft'}>
                      {() => (
                        <div className="w-full sm:w-auto">
                          <SubmitAuctionButton auctionId={auction.id} />
                        </div>
                      )}
                    </RenderIf>
                  </div>
                );
              })}
            </Card>

            <FeedPagination
              page={page}
              pageCount={pageCount}
              href={farmHomeStatusHref(status)}
            />
          </>
        )}
      </RenderIf>

      <RenderIf when={!failed && !auctions.length}>
        {() => (
          <EmptyFeed
            icon={<Gavel aria-hidden />}
            narrowing={Boolean(status)}
            noMatchTitle="Tidak ada lelang dengan status ini"
            noMatchBody="Pilih tab status lain, atau lihat semua lelang Anda."
            emptyTitle="Belum ada lelang"
            emptyBody="Lelang yang Anda buat muncul di sini, lengkap dengan statusnya."
          />
        )}
      </RenderIf>
    </div>
  );
}
