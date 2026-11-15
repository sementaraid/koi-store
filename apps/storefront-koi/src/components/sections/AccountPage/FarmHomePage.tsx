import { ClientError } from '@mercurjs/client';
import { AlertTriangle, Gavel, LockKeyhole, Plus, Sprout } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

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
import { farmAuctionHref, ROUTES } from '@/const/routes';
import { getMyAuctions, type AuctionListItem } from '@/lib/data/auctions';
import { getMyFarm, type FarmSeller } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { auctionStatusLabel } from '@/lib/helpers/auction-status';
import { farmStatusInfo } from '@/lib/helpers/farm-status';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';
import { SubmitAuctionButton } from './components/SubmitAuctionButton';

/** The Farmer area home.
 *
 * @remarks
 * Only a seller whose status is `open` gets in (US-021 AC4). Every other
 * status — pending, rejected, suspended, terminated — sees the same closed
 * card, worded by `farmStatusInfo`, with the rejection reason when there is
 * one. Registration is not offered to a seller that already exists: a
 * rejection is final (AC3), so the closed card links to the status page and
 * nowhere else. An approved farmer sees "Buat lelang" and a minimal list of
 * their own auctions (US-030 T-030.3); the full status tracker is T-033.2,
 * a later task. */
export async function FarmHomePage() {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.farmHome),
    getShell(),
    listOrderGroups()
  ]);

  let seller: FarmSeller | null = null;
  let failed = false;

  try {
    seller = await getMyFarm();
  } catch (err) {
    /* A member cookie that expired between requests is not "you never
       registered" — the sign-in page, then back here. */
    if (err instanceof ClientError && err.status === 401) {
      redirect(`${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmHome)}`);
    }
    failed = true;
  }

  const approved = seller ? farmStatusInfo(seller).approved : false;

  let auctions: AuctionListItem[] = [];
  let auctionsFailed = false;
  if (approved) {
    try {
      auctions = (await getMyAuctions()).auctions;
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
    <MyAuctions auctions={auctions} failed={auctionsFailed} />
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

/** The area while the seller is not `open` (US-021 AC2–AC4). */
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

/** An approved farmer's own auctions, newest first, plus the way to make a
    new one (US-030 T-030.3). Minimal on purpose: the full status tracker
    with pagination and filters is T-033.2, a later task. */
function MyAuctions({
  auctions,
  failed
}: {
  auctions: AuctionListItem[];
  failed: boolean;
}): ReactNode {
  return (
    <div className="grid gap-4">
      <div>
        <Button
          render={<Link href={ROUTES.farmAuctionNew} />}
          nativeButton={false}
        >
          <Plus aria-hidden />
          Buat lelang
        </Button>
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
          <Card className="px-5 py-1">
            {list.map((auction) => {
              const status = auctionStatusLabel(auction.status);
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
                      {new Date(auction.start_at).toLocaleDateString('id-ID')} –{' '}
                      {new Date(auction.end_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={status.tone}>{status.label}</Badge>
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
        )}
      </RenderIf>

      <RenderIf when={!failed && !auctions.length}>
        {() => (
          <EmptyFeed
            icon={<Gavel aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada lelang"
            noMatchBody="Lelang yang Anda buat muncul di sini, lengkap dengan statusnya."
          />
        )}
      </RenderIf>
    </div>
  );
}
