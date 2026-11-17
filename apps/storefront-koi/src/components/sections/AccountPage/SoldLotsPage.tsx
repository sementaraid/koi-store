import { ClientError } from '@mercurjs/client';
import { AlertTriangle, LockKeyhole, PackageCheck, Sprout } from 'lucide-react';
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
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { ROUTES } from '@/const/routes';
import { listSoldLots, type SoldLot } from '@/lib/data/sold-lots';
import { getMyFarm, type FarmSeller } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import { farmStatusInfo, soldLotsOpen } from '@/lib/helpers/farm-status';
import { soldLotStatusLabel } from '@/lib/helpers/sold-lot';
import {
  shippedTrackingLabel,
  soldLotAction
} from '@/lib/helpers/sold-lot-actions';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';
import { RevealAddress } from './components/RevealAddress';
import { ShipLot } from './components/ShipLot';

/** How many sold lots one page shows (matches the route's own default). */
const PER_PAGE = 20;

/** Props for {@link SoldLotsPage}: the route's own `?page=`, read server-side. */
export type SoldLotsPageProps = {
  page?: string | string[];
};

/** The farmer's sold lots (US-051 T-051.2b, AC2/AC5): each lot's outcome,
    final price and winner name, with the winner's default shipping address
    masked to city + province and a per-row reveal for the full one.
 *
 * @remarks
 * An `open` seller, or one `suspended` after approval (D-054), gets the list —
 * the latter with a notice that the farm is suspended. Every other status
 * (pending, rejected, terminated) sees the same closed card the Farmer area
 * home draws, worded by `farmStatusInfo` ({@link soldLotsOpen}). A member
 * cookie that expired mid-session redirects to sign-in, as everywhere else
 * here. */
export async function SoldLotsPage({ page: raw }: SoldLotsPageProps) {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.farmSold),
    getShell(),
    listOrderGroups()
  ]);

  let seller: FarmSeller | null = null;
  let failed = false;

  try {
    seller = await getMyFarm();
  } catch (err) {
    if (err instanceof ClientError && err.status === 401) {
      redirect(
        `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmSold)}`
      );
    }
    failed = true;
  }

  // D-054: a farm suspended *after* approval may still finish lots it already
  // sold, so this list stays open for it (unlike the rest of the Farmer area,
  // which `farmStatusInfo(seller).approved` keeps closed).
  const open = seller ? soldLotsOpen(seller) : false;
  const suspended = seller?.status === 'suspended' && open;

  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const requested = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);

  let lots: SoldLot[] = [];
  let count = 0;
  let lotsFailed = false;
  if (open) {
    try {
      const result = await listSoldLots(PER_PAGE, (requested - 1) * PER_PAGE);
      lots = result.lots;
      count = result.count;
    } catch (err) {
      if (err instanceof ClientError && err.status === 401) {
        redirect(
          `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmSold)}`
        );
      }
      lotsFailed = true;
    }
  }

  const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));
  const page = Math.min(requested, pageCount);

  const body = failed ? (
    <ErrorCard title="Gagal memuat status kebun" />
  ) : open ? (
    <SoldLots
      lots={lots}
      failed={lotsFailed}
      page={page}
      pageCount={pageCount}
      suspended={suspended}
    />
  ) : (
    <Closed seller={seller} />
  );

  return (
    <AccountFrame
      title="Lot terjual"
      eyebrow={
        <>
          <Sprout aria-hidden className="size-3.5" />
          Kebun
        </>
      }
      description="Lot Anda yang sudah terjual, lengkap dengan nama pemenang dan alamat kirimnya."
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    >
      {body}
    </AccountFrame>
  );
}

/** A failed read, drawn the same way everywhere on this page. */
function ErrorCard({ title }: { title: string }): ReactNode {
  return (
    <Card className="border-destructive-ink/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
          {title}
        </CardTitle>
        <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}

/** The list itself. */
function SoldLots({
  lots,
  failed,
  page,
  pageCount,
  suspended
}: {
  lots: SoldLot[];
  failed: boolean;
  page: number;
  pageCount: number;
  /** D-054: a farm suspended after approval. The list stays open, but the
      farmer is told why it's worth checking the admin. */
  suspended: boolean;
}): ReactNode {
  return (
    <div className="grid gap-4">
      <RenderIf when={suspended}>
        {() => (
          <div className="flex items-start gap-2 rounded-md border border-destructive-ink/30 bg-destructive/8 px-3 py-2">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive-ink" />
            <p className="text-sm text-foreground">
              Kebun Anda ditangguhkan; Anda tetap bisa menyelesaikan lot yang sudah
              terjual.
            </p>
          </div>
        )}
      </RenderIf>

      <RenderIf when={failed}>
        {() => <ErrorCard title="Gagal memuat daftar lot terjual" />}
      </RenderIf>

      <RenderIf when={!failed && lots.length ? lots : null}>
        {(list) => (
          <>
            <Card className="px-5 py-1">
              {list.map((lot) => {
                const status = soldLotStatusLabel(lot.status);
                const action = soldLotAction(lot.status);
                const tracking = shippedTrackingLabel(lot.status, lot.tracking_number);
                return (
                  <div
                    key={lot.id}
                    className="flex flex-wrap items-start justify-between gap-4 border-b border-border py-4 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {lot.product.thumbnail ? (
                        <img
                          src={lot.product.thumbnail}
                          alt=""
                          loading="lazy"
                          className="h-[60px] w-[48px] shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-[60px] w-[48px] shrink-0 rounded-xl bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">
                          {lot.product.title ?? 'Lot tanpa judul'}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Pemenang: {lot.winner.name}
                        </p>
                        <RenderIf when={lot.closed_at}>
                          {(closedAt) => (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Selesai {formatDeadline(closedAt)}
                            </p>
                          )}
                        </RenderIf>
                      </div>
                    </div>

                    <div className="grid min-w-[200px] gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={status.tone}>{status.label}</Badge>
                        <RenderIf when={lot.final_price}>
                          {(price) => (
                            <span className="text-sm font-bold text-foreground tabular-nums">
                              {formatPrice(price)}
                            </span>
                          )}
                        </RenderIf>
                      </div>
                      <RevealAddress
                        lotId={lot.id}
                        address={lot.winner.address}
                      />
                      {tracking ? (
                        <p className="text-xs text-muted-foreground">{tracking}</p>
                      ) : null}
                      {action === 'ship' ? (
                        <ShipLot
                          lotId={lot.id}
                          deliveryMethod={lot.auction.delivery_method}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </Card>

            <FeedPagination
              page={page}
              pageCount={pageCount}
              href={ROUTES.farmSold}
            />
          </>
        )}
      </RenderIf>

      <RenderIf when={!failed && !lots.length}>
        {() => (
          <EmptyFeed
            icon={<PackageCheck aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada lot terjual"
            noMatchBody="Lot yang menang di lelang Anda muncul di sini, lengkap dengan nama pemenang dan alamat kirimnya."
          />
        )}
      </RenderIf>
    </div>
  );
}

/** The area while the seller is not `open` — same wording as the home. */
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

  return (
    <Card className="px-5 py-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <LockKeyhole aria-hidden className="size-4 text-muted-foreground" />
          {info.title}
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-foreground">{info.body}</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Button
          variant="outline"
          render={<Link href={ROUTES.farm} />}
          nativeButton={false}
        >
          Lihat status kebun
        </Button>
      </CardContent>
    </Card>
  );
}
