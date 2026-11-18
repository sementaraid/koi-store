import { AlertTriangle, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge, Card, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { ROUTES, lotHref } from '@/const/routes';
import { listWonLots } from '@/lib/data/lots';
import { requireCustomer } from '@/lib/guard';
import {
  claimStatusLabel,
  claimWindowInfo,
  remedyLabel
} from '@/lib/helpers/claim';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import { soldLotStatusLabel } from '@/lib/helpers/sold-lot';
import { getShell } from '@/lib/shell';

import { listOrderGroups } from './AccountPage';
import { countOpen } from './components/Orders';
import { AccountFrame } from './components/AccountFrame';
import { ConfirmClaim } from './components/ConfirmClaim';
import { RevealBank } from './components/RevealBank';

/** How many won lots one page shows (matches the route's own default). */
const PER_PAGE = 20;

/** Props for {@link WonLotsPage}: the route's own `?page=`, read server-side. */
export type WonLotsPageProps = {
  page?: string | string[];
};

/** The winner's own won lots (US-051 T-051.7, AC6): status, final price and
    the farm name, with no farmer contact (D-044 on hold, D-052). A winner
    with no default shipping address sees a prompt to add one (D-056). */
export async function WonLotsPage({ page: raw }: WonLotsPageProps) {
  const [, { account, cart }, groups] = await Promise.all([
    requireCustomer(ROUTES.wonLots),
    getShell(),
    listOrderGroups()
  ]);

  const parsed = Number.parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  const requested = Number.isNaN(parsed) ? 1 : Math.max(parsed, 1);

  const result = await listWonLots({ limit: PER_PAGE, offset: (requested - 1) * PER_PAGE });
  const pageCount = Math.max(1, Math.ceil(result.count / PER_PAGE));
  const page = Math.min(requested, pageCount);

  return (
    <AccountFrame
      title="Lot yang dimenangkan"
      eyebrow={
        <>
          <Trophy aria-hidden className="size-3.5" />
          Lelang
        </>
      }
      description="Lot yang Anda menangkan, lengkap dengan status dan nama peternaknya."
      openOrders={countOpen(groups)}
      account={account}
      cart={cart}
    >
      <WonLots
        lots={result.lots}
        hasShippingAddress={result.has_shipping_address}
        page={page}
        pageCount={pageCount}
      />
    </AccountFrame>
  );
}

/** The list itself. */
function WonLots({
  lots,
  hasShippingAddress,
  page,
  pageCount
}: {
  lots: Awaited<ReturnType<typeof listWonLots>>['lots'];
  hasShippingAddress: boolean;
  page: number;
  pageCount: number;
}): ReactNode {
  /* Server-rendered once, so both the claim window copy and anything the client
     paints from it agree (same rule as the lot page's `now`). */
  const now = Date.now();

  return (
    <div className="grid gap-4">
      <RenderIf when={lots.length && !hasShippingAddress}>
        {() => (
          <div className="flex items-start gap-2 rounded-md border border-info/40 bg-muted/40 px-3 py-2">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground" />
            <p className="text-sm text-foreground">
              Tambahkan alamat pengiriman utama agar peternak bisa mengirim ikanmu.{' '}
              <Link href={ROUTES.addresses} className="font-medium underline">
                Tambah alamat
              </Link>
            </p>
          </div>
        )}
      </RenderIf>

      <RenderIf when={lots.length ? lots : null}>
        {(list) => (
          <>
            <Card className="px-5 py-1">
              {list.map((lot) => {
                const status = soldLotStatusLabel(lot.status);
                /* US-054: the caller's own claim state. A delivered lot without
                   one still has its window copy; the row links to the lot page,
                   where the claim form lives. */
                const claimWindow =
                  lot.status === 'delivered' && !lot.claim
                    ? claimWindowInfo(lot.claim_window_ends_at, now)
                    : null;
                return (
                  <div
                    key={lot.id}
                    className="flex flex-wrap items-start justify-between gap-4 border-b border-border py-4 last:border-b-0"
                  >
                    <Link href={lotHref(lot.id)} className="flex min-w-0 items-start gap-3">
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
                          Peternak: {lot.seller.name}
                        </p>
                        <RenderIf when={lot.closed_at}>
                          {(closedAt) => (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Selesai {formatDeadline(closedAt)}
                            </p>
                          )}
                        </RenderIf>
                        {/* D-058: the 1×24 h payment deadline (T-051.2a). Shown
                            only while the winner still owes the farmer, so a
                            paid row never carries a stale "bayar sebelum". */}
                        <RenderIf when={lot.status === 'won' ? lot.pay_by : null}>
                          {(payBy) => (
                            <p className="mt-0.5 text-xs font-medium text-foreground">
                              Bayar sebelum {formatDeadline(payBy)} WIB
                            </p>
                          )}
                        </RenderIf>
                      </div>
                    </Link>

                    <div className="grid min-w-[160px] justify-end gap-2 text-right">
                      <Badge variant={status.tone}>{status.label}</Badge>
                      {lot.claim ? (
                        <div className="grid gap-1">
                          <Badge variant="urgent">Klaim diajukan</Badge>
                          <span className="text-xs text-muted-foreground">
                            {claimStatusLabel(lot.claim.status)} ·{' '}
                            {remedyLabel(lot.claim.remedy)}
                          </span>
                          {/* US-056 T-056.2b: the farmer settled off-platform;
                              the winner confirms (D-058). */}
                          {lot.claim.status === 'resolved' ? (
                            <ConfirmClaim lotId={lot.id} />
                          ) : null}
                        </div>
                      ) : claimWindow ? (
                        <span className="text-xs text-muted-foreground">
                          {claimWindow.open ? (
                            <>
                              {claimWindow.label} ·{' '}
                              <span className="font-medium underline">Ajukan klaim</span>
                            </>
                          ) : (
                            claimWindow.label
                          )}
                        </span>
                      ) : null}
                      <RenderIf when={lot.final_price}>
                        {(price) => (
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {formatPrice(price)}
                          </span>
                        )}
                      </RenderIf>
                      {/* US-051 T-051.2a (D-059): the farm's payout account,
                          masked until the winner's logged reveal. */}
                      <RevealBank lotId={lot.id} details={lot.seller.payment_details} />
                    </div>
                  </div>
                );
              })}
            </Card>

            <FeedPagination
              page={page}
              pageCount={pageCount}
              href={ROUTES.wonLots}
            />
          </>
        )}
      </RenderIf>

      <RenderIf when={!lots.length}>
        {() => (
          <EmptyFeed
            icon={<Trophy aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada lot yang dimenangkan"
            noMatchBody="Lot yang Anda menangkan di lelang muncul di sini, lengkap dengan status dan nama peternaknya."
          />
        )}
      </RenderIf>
    </div>
  );
}
