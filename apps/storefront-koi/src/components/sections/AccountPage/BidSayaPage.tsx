import {
  AlertTriangle,
  Circle,
  CircleCheck,
  CircleDot,
  Clock,
  Gavel,
  Trophy
} from 'lucide-react';
import { Suspense } from 'react';
import { cn } from 'cn';

import { Button, Card } from '@koi/ui';
import { Link } from '@/components/atoms';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { BidSayaSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';
import { RetryButton } from '@/components/cells/RetryButton/RetryButton';
import { ROUTES, lotHref, myBidsTabHref } from '@/const/routes';
import { listLots, listMyBids, type StoreMyBid } from '@/lib/data/lots';
import { requireCustomer } from '@/lib/guard';
import { formatEndTime, formatLotNumber } from '@/lib/helpers/lot-card';
import { formatPrice } from '@/lib/helpers/format-price';
import {
  BID_TABS,
  bidTabLabel,
  groupMyBids,
  parseBidTab,
  wonSteps,
  type BidTab,
  type WonStepState
} from '@/lib/helpers/my-bids';
import { getAccountIdentity } from '@/lib/shell';

import { AccountFrame } from './components/AccountFrame';
import { ActiveBidCard } from './components/ActiveBidCard';

export type BidSayaPageProps = {
  tab?: string | string[];
};

// Tab and lists wait inside the frame, so header, navigation and the page title
// are usable while only the data loads (US-101 AC6, board 15).
export async function BidSayaPage({ tab: raw }: BidSayaPageProps) {
  const tab = parseBidTab(raw);
  const [, identity] = await Promise.all([
    requireCustomer(myBidsTabHref(tab)),
    getAccountIdentity()
  ]);

  return (
    <AccountFrame
      title="Bid Saya"
      eyebrow={
        <>
          <Gavel aria-hidden className="size-3.5" />
          Lelang
        </>
      }
      description="Lot yang Anda ikuti, menangkan, dan lewatkan."
      identity={identity}
    >
      <Suspense key={tab} fallback={<BidSayaSkeleton />}>
        <BidSayaContent tab={tab} />
      </Suspense>
    </AccountFrame>
  );
}

async function BidSayaContent({ tab }: { tab: BidTab }) {
  const [{ lots, failed }, live] = await Promise.all([
    listMyBids(),
    // Only the empty Aktif state shows the number of live lots.
    listLots({ status: 'live', limit: 1 })
  ]);

  return (
    <BidSayaView
      tab={tab}
      bids={lots}
      liveCount={live.failed ? 0 : live.count}
      failed={failed}
    />
  );
}

function BidSayaView({
  tab,
  bids,
  liveCount,
  failed
}: {
  tab: BidTab;
  bids: StoreMyBid[];
  liveCount: number;
  failed?: boolean;
}) {
  const buckets = groupMyBids(bids);

  return (
    <div className="flex flex-col gap-6">
      <BidTabs active={tab} counts={failed ? undefined : buckets.counts} />

      {failed ? (
        <BidSayaError />
      ) : tab === 'aktif' ? (
        <ActiveList bids={buckets.active} liveCount={liveCount} />
      ) : tab === 'menang' ? (
        <WonList bids={buckets.won} />
      ) : (
        <LostList bids={buckets.lost} />
      )}
    </div>
  );
}

function BidTabs({
  active,
  counts
}: {
  active: BidTab;
  counts?: { aktif: number; menang: number };
}) {
  return (
    <nav
      aria-label="Bid saya"
      className="flex w-full gap-1 overflow-x-auto rounded-control bg-muted p-1 sm:w-fit"
    >
      {BID_TABS.map((tab) => (
        <Link
          key={tab}
          href={myBidsTabHref(tab)}
          aria-current={tab === active ? 'page' : undefined}
          className={cn(
            'inline-flex h-11 flex-1 items-center justify-center rounded-control px-3 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring sm:flex-none',
            tab === active
              ? 'bg-background font-semibold text-accent-ink shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {bidTabLabel(tab, tab === 'kalah' ? undefined : counts?.[tab])}
        </Link>
      ))}
    </nav>
  );
}

function ActiveList({ bids, liveCount }: { bids: StoreMyBid[]; liveCount: number }) {
  if (!bids.length) {
    return (
      <EmptyFeed
        icon={<Gavel aria-hidden className="size-8" />}
        narrowing={false}
        noMatchTitle="Belum ada bid aktif"
        noMatchBody="Lot yang Anda ikuti muncul di sini, lengkap dengan posisi bid dan sisa waktunya."
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button render={<Link href={ROUTES.auctions} />} nativeButton={false}>
              {liveCount > 0 ? `Lihat ${liveCount} lelang live` : 'Lihat lelang'}
            </Button>
            <Link
              href={ROUTES.guide}
              className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline focus-visible:underline"
            >
              Cara ikut lelang
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bids.map((bid) => (
        <ActiveBidCard key={bid.lot_id} bid={bid} />
      ))}
    </div>
  );
}

function WonList({ bids }: { bids: StoreMyBid[] }) {
  if (!bids.length) {
    return (
      <EmptyFeed
        icon={<Trophy aria-hidden className="size-8" />}
        narrowing={false}
        noMatchTitle="Belum ada lot yang dimenangkan"
        noMatchBody="Lot yang Anda menangkan di lelang muncul di sini, lengkap dengan status dan nama peternaknya."
        action={
          <Button render={<Link href={ROUTES.auctions} />} nativeButton={false}>
            Lihat lelang
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bids.map((bid) => (
        <WonCard key={bid.lot_id} bid={bid} />
      ))}
    </div>
  );
}

function WonCard({ bid }: { bid: StoreMyBid }) {
  const { lot } = bid;
  const title = lot.title ?? formatLotNumber(lot.lot_number);
  const price = lot.final_price ?? lot.current_price;

  return (
    <Card className="relative gap-4 p-4">
      <div className="flex min-w-0 gap-3">
        {lot.photos[0] ? (
          <img
            src={lot.photos[0]}
            alt={title}
            loading="lazy"
            className="h-16 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div aria-hidden className="h-16 w-20 shrink-0 rounded-xl bg-muted" />
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold">
            <Link
              href={lotHref(lot.id)}
              className="rounded-control after:absolute after:inset-0 after:rounded-control focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2"
            >
              {title}
            </Link>
          </h3>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span className="whitespace-nowrap tabular-nums">
              {formatLotNumber(lot.lot_number)}
            </span>
            {lot.auction.seller ? (
              <>
                <span aria-hidden>·</span>
                <span className="min-w-0 truncate">{lot.auction.seller.name}</span>
              </>
            ) : null}
          </p>
          {price !== null ? (
            <p className="font-semibold tabular-nums">{formatPrice(price)}</p>
          ) : null}
          <p className="text-xs text-muted-foreground tabular-nums">
            Berakhir {formatEndTime(lot.end_time)}
          </p>
        </div>
      </div>

      <ol aria-label="Status lot" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {wonSteps(bid.lot_status).map((step) => (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="flex items-center gap-2 text-sm"
          >
            <StepIcon state={step.state} />
            <span
              className={cn(
                step.state === 'todo'
                  ? 'text-muted-foreground'
                  : 'font-medium text-foreground'
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function StepIcon({ state }: { state: WonStepState }) {
  if (state === 'done') return <CircleCheck aria-hidden className="size-4 shrink-0" />;
  if (state === 'current') {
    return <CircleDot aria-hidden className="size-4 shrink-0 text-accent-ink" />;
  }
  return <Circle aria-hidden className="size-4 shrink-0 text-muted-foreground" />;
}

function LostList({ bids }: { bids: StoreMyBid[] }) {
  if (!bids.length) {
    return (
      <EmptyFeed
        icon={<Clock aria-hidden className="size-8" />}
        narrowing={false}
        noMatchTitle="Belum ada lot yang kalah"
        noMatchBody="Lot yang Anda ikuti tetapi dimenangkan pembeli lain muncul di sini, lengkap dengan harga akhirnya."
        action={
          <Button render={<Link href={ROUTES.auctions} />} nativeButton={false}>
            Lihat lelang
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bids.map((bid) => (
        <LostCard key={bid.lot_id} bid={bid} />
      ))}
    </div>
  );
}

function LostCard({ bid }: { bid: StoreMyBid }) {
  const { lot } = bid;
  const title = lot.title ?? formatLotNumber(lot.lot_number);
  const finalPrice = lot.final_price ?? lot.current_price;

  return (
    <Card className="gap-3 p-4">
      <div className="flex min-w-0 gap-3">
        {lot.photos[0] ? (
          <img
            src={lot.photos[0]}
            alt={title}
            loading="lazy"
            className="h-16 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div aria-hidden className="h-16 w-20 shrink-0 rounded-xl bg-muted" />
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span className="whitespace-nowrap tabular-nums">
              {formatLotNumber(lot.lot_number)}
            </span>
            {lot.auction.seller ? (
              <>
                <span aria-hidden>·</span>
                <span className="min-w-0 truncate">{lot.auction.seller.name}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Harga akhir</dt>
          <dd className="font-semibold tabular-nums">
            {finalPrice !== null ? formatPrice(finalPrice) : 'Tidak terjual'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bid Anda</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(bid.my_highest_bid)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Berakhir</dt>
          <dd className="tabular-nums">{formatEndTime(lot.end_time)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function BidSayaError() {
  return (
    <div role="alert">
      <EmptyFeed
        icon={<AlertTriangle aria-hidden className="size-8" />}
        narrowing={false}
        noMatchTitle="Bid Saya belum bisa dimuat"
        noMatchBody="Ada gangguan saat mengambil bid Anda. Data Anda aman. Muat ulang halaman ini."
        action={<RetryButton />}
      />
    </div>
  );
}
