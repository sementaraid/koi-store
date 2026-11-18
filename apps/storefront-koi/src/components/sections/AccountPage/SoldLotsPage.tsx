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
import { listVendorClaims, type VendorClaim } from '@/lib/data/claims';
import { getMyFarm, type FarmSeller } from '@/lib/data/farm';
import { requireCustomer } from '@/lib/guard';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import { remedyLabel } from '@/lib/helpers/claim';
import { farmerClaimStatus, formatClaimOpenedAt } from '@/lib/helpers/farm-claim';
import { farmStatusInfo, soldLotsOpen } from '@/lib/helpers/farm-status';
import { soldLotStatusLabel } from '@/lib/helpers/sold-lot';
import {
  canReportUnpaid,
  shippedTrackingLabel,
  soldLotAction
} from '@/lib/helpers/sold-lot-actions';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';
import { ClaimDecision } from './components/ClaimDecision';
import { ClaimResolution } from './components/ClaimResolution';
import { ClaimVideo } from './components/ClaimVideo';
import { MarkPaid } from './components/MarkPaid';
import { ReportUnpaid } from './components/ReportUnpaid';
import { RevealAddress } from './components/RevealAddress';
import { ShipLot } from './components/ShipLot';

const PER_PAGE = 20;

export type SoldLotsPageProps = {
  page?: string | string[];
};

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

  const open = seller ? soldLotsOpen(seller) : false;
  const suspended = seller?.status === 'suspended' && open;

  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const requested = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);

  let lots: SoldLot[] = [];
  let claims: VendorClaim[] = [];
  let count = 0;
  let lotsFailed = false;
  let claimsFailed = false;
  if (open) {
    const [lotsResult, claimsResult] = await Promise.all([
      listSoldLots(PER_PAGE, (requested - 1) * PER_PAGE).catch((err: unknown) => {
        if (err instanceof ClientError && err.status === 401) {
          redirect(
            `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farmSold)}`
          );
        }
        return null;
      }),
      listVendorClaims(100, 0)
    ]);

    if (lotsResult) {
      lots = lotsResult.lots;
      count = lotsResult.count;
    } else {
      lotsFailed = true;
    }

    if ('value' in claimsResult) {
      claims = claimsResult.value.claims;
    } else {
      claimsFailed = true;
    }
  }

  const claimsByLot = new Map(claims.map((claim) => [claim.lot_id, claim]));

  const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));
  const page = Math.min(requested, pageCount);

  const body = failed ? (
    <ErrorCard title="Gagal memuat status kebun" />
  ) : open ? (
    <SoldLots
      lots={lots}
      claimsByLot={claimsByLot}
      failed={lotsFailed}
      claimsFailed={claimsFailed}
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

function ClaimBlock({ claim }: { claim: VendorClaim }): ReactNode {
  const status = farmerClaimStatus(claim.status);
  return (
    <div className="basis-full rounded-xl border border-border bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-foreground">Klaim DOA</p>
        <Badge variant={status.tone}>{status.label}</Badge>
        <span className="text-xs text-muted-foreground">{remedyLabel(claim.remedy)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Diajukan {formatClaimOpenedAt(claim.opened_at)} oleh {claim.winner.name || 'pemenang'}
      </p>
      {claim.has_video ? (
        <div className="mt-2">
          <ClaimVideo claimId={claim.id} />
        </div>
      ) : null}
      {claim.status === 'open' ? (
        <ClaimDecision claimId={claim.id} remedy={claim.remedy} />
      ) : null}
      {claim.status === 'approved' ? (
        <ClaimResolution claimId={claim.id} remedy={claim.remedy} />
      ) : null}
    </div>
  );
}

function SoldLots({
  lots,
  claimsByLot,
  failed,
  claimsFailed,
  page,
  pageCount,
  suspended
}: {
  lots: SoldLot[];
  claimsByLot: Map<string, VendorClaim>;
  failed: boolean;
  claimsFailed: boolean;
  page: number;
  pageCount: number;
  suspended: boolean;
}): ReactNode {
  const now = Date.now();
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

      <RenderIf when={!failed && claimsFailed}>
        {() => <ErrorCard title="Gagal memuat klaim" />}
      </RenderIf>

      <RenderIf when={!failed && lots.length ? lots : null}>
        {(list) => (
          <>
            <Card className="px-5 py-1">
              {list.map((lot) => {
                const status = soldLotStatusLabel(lot.status);
                const action = soldLotAction(lot.status);
                const tracking = shippedTrackingLabel(lot.status, lot.tracking_number);
                const report = canReportUnpaid({
                  status: lot.status,
                  payBy: lot.pay_by,
                  reportedAt: lot.unpaid?.reported_at ?? null,
                  now
                });
                const claim = claimsByLot.get(lot.id);
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
                      {action === 'pay' ? <MarkPaid lotId={lot.id} /> : null}
                      <RenderIf when={lot.unpaid}>
                        {(unpaid) => (
                          <p className="text-xs text-muted-foreground">
                            Dilaporkan {formatClaimOpenedAt(unpaid.reported_at)}
                          </p>
                        )}
                      </RenderIf>
                      {report.show ? <ReportUnpaid lotId={lot.id} /> : null}
                      {action === 'ship' ? (
                        <ShipLot
                          lotId={lot.id}
                          deliveryMethod={lot.auction.delivery_method}
                        />
                      ) : null}
                    </div>

                    {claim ? <ClaimBlock claim={claim} /> : null}
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
