import {
  AlertTriangle,
  Circle,
  CircleCheck,
  CircleDot,
  Clock,
  Gavel,
  Trophy
} from 'lucide-react';
import { Suspense, cache } from 'react';
import { cn } from 'cn';

import { Badge, Button, Card } from '@koi/ui';
import { Link, Stars } from '@/components/atoms';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { BidSayaSkeleton } from '@/components/sections/LoadingPages/AccountLoadingPages';
import { RetryButton } from '@/components/cells/RetryButton/RetryButton';
import { BID_SAYA_CONTENT } from '@/const/layout';
import { ROUTES, lotHref, myBidsTabHref } from '@/const/routes';
import {
  listLots,
  listMyBids,
  listWonLots,
  type StoreMyBid,
  type WonLot,
  type WonLotClaim
} from '@/lib/data/lots';
import { getPlatformBankAccount, type PlatformBankAccount } from '@/lib/data/topups';
import { requireCustomer } from '@/lib/guard';
import {
  claimStatusLabel,
  remedyLabel
} from '@/lib/helpers/claim';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatEndTime, formatLotNumber } from '@/lib/helpers/lot-card';
import { formatPrice } from '@/lib/helpers/format-price';
import { canRateLot, type LotRating } from '@/lib/helpers/lot-rating';
import {
  BID_TABS,
  bidTabLabel,
  groupMyBids,
  parseBidTab,
  wonSteps,
  type BidTab,
  type WonStep,
  type WonStepState
} from '@/lib/helpers/my-bids';
import { wonNextAction } from '@/lib/helpers/won-lot';
import { getAccountIdentity } from '@/lib/shell';

import { AccountFrame } from './components/AccountFrame';
import { ActiveBidCard } from './components/ActiveBidCard';
import { ConfirmClaim } from './components/ConfirmClaim';
import { RateFarmer } from './components/RateFarmer';
import { WonLotActions } from './components/WonLotActions';

export type BidSayaPageProps = {
  tab?: string | string[];
};

// The tab strip and the list read the same bids; one request serves both.
const loadMyBids = cache(listMyBids);

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
      identity={identity}
      contentClassName={BID_SAYA_CONTENT}
      actionClassName="max-sm:w-full"
      action={
        <Suspense fallback={<BidTabs active={tab} />}>
          <BidTabsHeader tab={tab} />
        </Suspense>
      }
    >
      <Suspense key={tab} fallback={<BidSayaSkeleton shape={tab === 'menang' ? 'won' : 'active'} />}>
        <BidSayaContent tab={tab} />
      </Suspense>
    </AccountFrame>
  );
}

async function BidTabsHeader({ tab }: { tab: BidTab }) {
  const { lots, failed } = await loadMyBids();
  return <BidTabs active={tab} counts={failed ? undefined : groupMyBids(lots).counts} />;
}

async function BidSayaContent({ tab }: { tab: BidTab }) {
  const [{ lots, failed }, live, won, bank] = await Promise.all([
    loadMyBids(),
    // Only the empty Aktif state shows the number of live lots.
    listLots({ status: 'live', limit: 1 }),
    // The Menang cards need the dates, claim and rating that the won-lot route
    // returns; `my-bids` only carries the public lot shape (T-112.2 AC3).
    listWonLots({ limit: 100 }),
    getPlatformBankAccount().catch(() => null)
  ]);

  return (
    <BidSayaView
      tab={tab}
      bids={lots}
      liveCount={live.failed ? 0 : live.count}
      failed={failed}
      wonLots={won.lots}
      hasShippingAddress={won.has_shipping_address}
      wonFailed={won.failed}
      bank={bank}
    />
  );
}

function BidSayaView({
  tab,
  bids,
  liveCount,
  failed,
  wonLots,
  hasShippingAddress,
  wonFailed,
  bank
}: {
  tab: BidTab;
  bids: StoreMyBid[];
  liveCount: number;
  failed?: boolean;
  wonLots: WonLot[];
  hasShippingAddress: boolean;
  wonFailed?: boolean;
  bank: PlatformBankAccount | null;
}) {
  const buckets = groupMyBids(bids);
  const tabFailed = failed || (tab === 'menang' && wonFailed);

  return (
    <div className="flex flex-col gap-6">
      {tabFailed ? (
        <BidSayaError />
      ) : tab === 'aktif' ? (
        <ActiveList bids={buckets.active} liveCount={liveCount} />
      ) : tab === 'menang' ? (
        <WonList
          bids={buckets.won}
          wonLots={wonLots}
          hasShippingAddress={hasShippingAddress}
          bank={bank}
        />
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
      className="flex w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit"
    >
      {BID_TABS.map((tab) => (
        <Link
          key={tab}
          href={myBidsTabHref(tab)}
          aria-current={tab === active ? 'page' : undefined}
          className={cn(
            'inline-flex h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring sm:h-9 sm:flex-none',
            tab === active
              ? 'bg-background font-semibold text-accent-ink shadow-xs ring-1 ring-accent-ink/15'
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
        iconClassName="size-16 rounded-full border border-border bg-muted"
        titleClassName="font-heading text-lg font-bold sm:text-xl"
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

function WonList({
  bids,
  wonLots,
  hasShippingAddress,
  bank
}: {
  bids: StoreMyBid[];
  wonLots: WonLot[];
  hasShippingAddress: boolean;
  bank: PlatformBankAccount | null;
}) {
  if (!bids.length) {
    return (
      <EmptyFeed
        icon={<Trophy aria-hidden className="size-8" />}
        iconClassName="size-16 rounded-full border border-border bg-muted"
        titleClassName="font-heading text-lg font-bold sm:text-xl"
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

  const now = Date.now();
  const wonById = new Map(wonLots.map((lot) => [lot.id, lot]));

  return (
    <div className="flex flex-col gap-4">
      {bids.map((bid) => (
        <WonCard
          key={bid.lot_id}
          bid={bid}
          extra={wonById.get(bid.lot_id)}
          hasShippingAddress={hasShippingAddress}
          bank={bank}
          now={now}
        />
      ))}
    </div>
  );
}

function WonCard({
  bid,
  extra,
  hasShippingAddress,
  bank,
  now
}: {
  bid: StoreMyBid;
  extra?: WonLot;
  hasShippingAddress: boolean;
  bank: PlatformBankAccount | null;
  now: number;
}) {
  const { lot } = bid;
  const title = lot.title ?? formatLotNumber(lot.lot_number);
  const price = extra?.final_price ?? lot.final_price ?? lot.current_price;
  const status = extra?.status ?? bid.lot_status ?? 'won';
  const claim = extra?.claim ?? null;
  const closedAt = extra?.closed_at ?? null;

  const nextAction = extra
    ? wonNextAction({
        status,
        claim,
        claimWindowEndsAt: extra.claim_window_ends_at,
        hasShippingAddress,
        payBy: extra.pay_by,
        now
      })
    : null;

  const steps = wonSteps(status, {
    closed_at: extra?.closed_at,
    paid_at: extra?.paid_at,
    shipped_at: extra?.shipped_at,
    delivered_at: extra?.delivered_at,
    tracking_number: extra?.tracking_number
  });

  const rating = extra?.rating ?? null;
  const rateable = extra ? canRateLot({ status, rating }).show : false;

  return (
    <Card className="gap-4 p-4 lg:gap-5 lg:p-5">
      <div className="flex min-w-0 gap-3 lg:gap-5">
        {lot.photos[0] ? (
          <img
            src={lot.photos[0]}
            alt={title}
            loading="lazy"
            className="h-[66px] w-[88px] shrink-0 rounded-xl object-cover lg:h-[120px] lg:w-40"
          />
        ) : (
          <div
            aria-hidden
            className="h-[66px] w-[88px] shrink-0 rounded-xl bg-muted lg:h-[120px] lg:w-40"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {nextAction ? (
              <Badge variant="warning" icon={<AlertTriangle />}>
                Perlu tindakan
              </Badge>
            ) : null}
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
              <span className="whitespace-nowrap tabular-nums">
                {formatLotNumber(lot.lot_number)}
              </span>
              {lot.auction.seller || closedAt ? <span aria-hidden>·</span> : null}
              {/* The mobile frame puts the farm on this line and the win date in
                  the timeline; the desktop frame does the reverse. */}
              {lot.auction.seller ? (
                <span className="min-w-0 truncate lg:hidden">{lot.auction.seller.name}</span>
              ) : null}
              {closedAt ? (
                <span
                  className={cn(
                    'whitespace-nowrap',
                    lot.auction.seller && 'hidden lg:inline'
                  )}
                >
                  menang {formatDeadline(closedAt)} WIB
                </span>
              ) : null}
            </p>
          </div>
          <h3 className="text-base font-semibold lg:text-xl">
            <Link
              href={lotHref(lot.id)}
              className="rounded-control underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              {title}
            </Link>
          </h3>
          {lot.auction.seller ? (
            <p className="hidden min-w-0 truncate text-sm text-muted-foreground lg:block">
              {lot.auction.seller.name}
            </p>
          ) : null}
          {price !== null ? (
            <p className="mt-0.5 text-base font-semibold tabular-nums lg:text-xl">
              {formatPrice(price)}
            </p>
          ) : null}
        </div>
      </div>

      {nextAction ? (
        <div className="flex gap-3 rounded-control border border-warning/30 bg-warning/8 px-4 py-3 text-sm text-foreground">
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>{nextAction}</p>
        </div>
      ) : null}

      <WonTimeline steps={steps} />

      {claim ? (
        <ClaimBlock lotId={lot.id} claim={claim} />
      ) : extra ? (
        <WonLotActions
          lotId={lot.id}
          status={status}
          hasShippingAddress={hasShippingAddress}
          claimWindowEndsAt={extra.claim_window_ends_at}
          claim={null}
          finalPrice={price}
          payBy={extra.pay_by}
          bank={bank}
          proof={extra.proof}
          arrivalProof={extra.arrival_proof}
          now={now}
        />
      ) : null}

      {rating ? <RatedBlock rating={rating} /> : null}
      {rateable && lot.auction.seller ? (
        <div>
          <RateFarmer lotId={lot.id} sellerName={lot.auction.seller.name} />
        </div>
      ) : null}
    </Card>
  );
}

function WonTimeline({ steps }: { steps: WonStep[] }) {
  return (
    <ol
      aria-label="Riwayat lot"
      className="grid lg:grid-cols-4 lg:gap-3"
    >
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const reached = step.state !== 'todo';
        return (
          <li
            key={step.key}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className="relative flex gap-3 pb-4 last:pb-0 lg:flex-col lg:gap-2 lg:pb-0"
          >
            {last ? null : (
              <span
                aria-hidden
                className="absolute top-6 bottom-0 left-[9px] w-px bg-border lg:hidden"
              />
            )}
            <span className="relative z-10 bg-card lg:hidden">
              <StepIcon state={step.state} />
            </span>
            <span
              aria-hidden
              className={cn(
                'hidden h-1 w-full rounded-full lg:block',
                step.state === 'done'
                  ? 'bg-success'
                  : step.state === 'current'
                    ? 'bg-accent-ink'
                    : 'bg-divider'
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm',
                  reached ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              {reached && step.date ? (
                <p className="text-xs text-muted-foreground tabular-nums lg:text-sm">
                  {formatDeadline(step.date)} WIB
                </p>
              ) : null}
              {reached && step.tracking ? (
                <p className="text-xs text-muted-foreground lg:text-sm">Resi {step.tracking}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepIcon({ state }: { state: WonStepState }) {
  if (state === 'done') {
    return <CircleCheck aria-hidden className="size-5 shrink-0 text-success" />;
  }
  if (state === 'current') {
    return <CircleDot aria-hidden className="size-5 shrink-0 text-accent-ink" />;
  }
  return <Circle aria-hidden className="size-5 shrink-0 text-muted-foreground" />;
}

function ClaimBlock({ lotId, claim }: { lotId: string; claim: WonLotClaim }) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="urgent">Klaim diajukan</Badge>
        <span className="text-xs text-muted-foreground">
          {claimStatusLabel(claim.status)} · {remedyLabel(claim.remedy)}
        </span>
      </div>
      {claim.status === 'resolved' ? <ConfirmClaim lotId={lotId} /> : null}
    </div>
  );
}

function RatedBlock({ rating }: { rating: LotRating }) {
  return (
    <div className="grid gap-0.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
        Sudah dinilai
        <Stars value={rating.stars} />
      </span>
      {rating.comment ? (
        <p className="max-w-[320px] text-xs break-words text-muted-foreground">
          {rating.comment}
        </p>
      ) : null}
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatDeadline(rating.created_at)} WIB
      </span>
    </div>
  );
}

function LostList({ bids }: { bids: StoreMyBid[] }) {
  if (!bids.length) {
    return (
      <EmptyFeed
        icon={<Clock aria-hidden className="size-8" />}
        iconClassName="size-16 rounded-full border border-border bg-muted"
        titleClassName="font-heading text-lg font-bold sm:text-xl"
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
