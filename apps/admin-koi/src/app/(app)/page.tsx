import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { AdminEmpty } from '@/components/AdminEmpty';
import { AdminError } from '@/components/AdminError';
import { ROUTES } from '@/const/routes';
import { getAuctionQueue } from '@/lib/data/auctions';
import { listClaims } from '@/lib/data/claims';
import { listFarmPayouts } from '@/lib/data/farm-payouts';
import { getFarmQueues } from '@/lib/data/farms';
import { listWonLotPayments } from '@/lib/data/lot-payments';
import { listReports } from '@/lib/data/reports';
import { getTopupQueues } from '@/lib/data/topups';
import { requireAdmin } from '@/lib/guard';
import { accountName } from '@/lib/helpers/account-format';
import { lotPaymentLabel } from '@/lib/helpers/lot-payment-format';
import { relativeTimeLabel } from '@/lib/helpers/relative-time';
import { formatRupiah } from '@/lib/helpers/topup-format';

export const metadata: Metadata = {
  title: 'Beranda'
};

type IconName = 'leaf' | 'wallet' | 'gavel' | 'shield' | 'banknote' | 'transfer' | 'flag';

type ActionTile = {
  href: string;
  label: string;
  value: number | null;
  detail: string;
  icon: IconName;
};

type Activity = {
  id: string;
  source: 'farm' | 'topup' | 'claim' | 'payout' | 'report' | 'payment';
  label: string;
  detail: string;
  at: string;
  href: string;
};

const ICONS: Record<IconName, ReactNode> = {
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  gavel: (
    <>
      <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </>
  ),
  banknote: (
    <>
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  transfer: (
    <>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </>
  )
};

// One colour per activity source, so a busy queue is still recognisable at a
// glance. The label beside the dot carries the meaning; the colour is a hint.
const SOURCE_DOT: Record<Activity['source'], string> = {
  farm: 'bg-accent-ink',
  topup: 'bg-success',
  claim: 'bg-destructive-ink',
  payout: 'bg-warning',
  report: 'bg-muted-foreground',
  payment: 'bg-primary'
};

const TODAY = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta'
});

export default async function HomeRoute() {
  await requireAdmin(ROUTES.home);

  const [farms, topups, auctions, disputedClaims, payments, duePayouts, pendingPayouts, reports] =
    await Promise.all([
      getFarmQueues(),
      getTopupQueues(),
      getAuctionQueue(),
      listClaims('disputed'),
      listWonLotPayments(false),
      listFarmPayouts('due'),
      listFarmPayouts('pending'),
      listReports('open')
    ]);

  const wonLots = payments?.lots ?? null;
  const overduePayments = wonLots === null ? null : wonLots.filter((lot) => lot.overdue).length;

  const tiles: ActionTile[] = [
    {
      href: ROUTES.farms,
      label: 'Pendaftaran kebun',
      value: farms?.pendingTotal ?? null,
      detail: 'Menunggu persetujuan',
      icon: 'leaf'
    },
    {
      href: ROUTES.topups,
      label: 'Permintaan top-up',
      value: topups?.pending.length ?? null,
      detail: 'Menunggu dicek',
      icon: 'wallet'
    },
    {
      href: ROUTES.auctions,
      label: 'Persetujuan lelang',
      value: auctions?.total ?? null,
      detail: 'Menunggu persetujuan',
      icon: 'gavel'
    },
    {
      href: ROUTES.claims,
      label: 'Klaim sengketa',
      value: disputedClaims?.count ?? null,
      detail: 'Perlu keputusan',
      icon: 'shield'
    },
    {
      href: ROUTES.payments,
      label: 'Pembayaran pemenang',
      value: payments?.count ?? null,
      detail:
        overduePayments === null ? 'Menunggu konfirmasi' : `${overduePayments} lewat batas`,
      icon: 'banknote'
    },
    {
      href: ROUTES.farmPayouts,
      label: 'Pembayaran ke farm',
      value:
        duePayouts && pendingPayouts ? duePayouts.count + pendingPayouts.count : null,
      detail:
        duePayouts && pendingPayouts
          ? `${duePayouts.count} jatuh tempo · ${pendingPayouts.count} menunggu`
          : 'Jatuh tempo dan menunggu',
      icon: 'transfer'
    },
    {
      href: ROUTES.reports,
      label: 'Laporan terbaru',
      value: reports?.count ?? null,
      detail: 'Laporan terbuka',
      icon: 'flag'
    }
  ];

  const activity: Activity[] = [];

  for (const farm of farms?.pending ?? []) {
    activity.push({
      id: `farm-${farm.id}`,
      source: 'farm',
      label: 'Pendaftaran kebun',
      detail: farm.name,
      at: farm.created_at,
      href: ROUTES.farms
    });
  }

  for (const topup of [...(topups?.pending ?? []), ...(topups?.decided ?? [])]) {
    activity.push({
      id: `topup-${topup.id}`,
      source: 'topup',
      label: 'Top-up',
      detail: `${topup.customer ? accountName(topup.customer) : '—'} · ${formatRupiah(topup.amount)}`,
      at: topup.created_at,
      href: ROUTES.topups
    });
  }

  for (const claim of disputedClaims?.claims ?? []) {
    activity.push({
      id: `claim-${claim.id}`,
      source: 'claim',
      label: 'Klaim DOA',
      detail: claim.product.title?.trim() || 'Klaim sengketa',
      at: claim.opened_at,
      href: ROUTES.claims
    });
  }

  for (const payout of [...(duePayouts?.payouts ?? []), ...(pendingPayouts?.payouts ?? [])]) {
    const at = payout.due_at ?? payout.arrival_proof_uploaded_at;
    if (!at) continue;

    activity.push({
      id: `payout-${payout.id}`,
      source: 'payout',
      label: 'Pembayaran farm',
      detail: `${payout.farm.name || '—'} · ${formatRupiah(payout.gross_amount)}`,
      at,
      href: ROUTES.farmPayouts
    });
  }

  for (const report of reports?.reports ?? []) {
    activity.push({
      id: `report-${report.id}`,
      source: 'report',
      label: 'Laporan',
      detail: report.product.title?.trim() || 'Laporan belum dibayar',
      at: report.reported_at,
      href: ROUTES.reports
    });
  }

  for (const lot of wonLots ?? []) {
    if (!lot.closed_at) continue;

    activity.push({
      id: `payment-${lot.id}`,
      source: 'payment',
      label: 'Pembayaran pemenang',
      detail: lotPaymentLabel(lot.lot_number, lot.title),
      at: lot.closed_at,
      href: ROUTES.payments
    });
  }

  // The newest row from each queue, so one busy queue does not crowd the rest
  // of the dashboard out of the activity list.
  const newestBySource = new Map<Activity['source'], Activity>();
  for (const event of activity) {
    if (Number.isNaN(new Date(event.at).getTime())) continue;

    const current = newestBySource.get(event.source);
    if (!current || event.at > current.at) newestBySource.set(event.source, event);
  }

  const recent = [...newestBySource.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const anythingLoaded = [
    farms,
    topups,
    auctions,
    disputedClaims,
    payments,
    duePayouts,
    pendingPayouts,
    reports
  ].some((value) => value !== null);

  const primaryTiles = tiles.slice(0, 4);
  const secondaryTiles = tiles.slice(4);

  return (
    <div className="grid gap-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <p className="text-2xs font-bold tracking-widest text-accent-ink uppercase">
            Ringkasan hari ini
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Beranda</h1>
          <p className="text-sm text-muted-foreground">
            Antrean yang perlu ditindak dan aktivitas terbaru.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{TODAY.format(new Date())}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-7">
          <section aria-labelledby="perlu-tindakan-heading" className="grid gap-3">
            <h2 id="perlu-tindakan-heading" className="font-heading text-lg font-bold">
              Perlu tindakan
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {primaryTiles.map((tile) => {
                const active = tile.value !== null && tile.value > 0;

                return (
                  <Link
                    key={tile.href}
                    href={tile.href}
                    className="group flex flex-col gap-5 rounded-card border border-card-edge bg-card p-4 shadow-card transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:p-5"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-11 items-center justify-center rounded-xl bg-accent ${
                        active ? 'text-accent-ink' : 'text-muted-foreground'
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-5"
                      >
                        {ICONS[tile.icon]}
                      </svg>
                    </span>

                    <span className="grid gap-1">
                      <span
                        className={`font-heading text-3xl leading-none font-bold tabular-nums ${
                          active ? 'text-accent-ink' : 'text-muted-foreground'
                        }`}
                      >
                        {tile.value === null ? '—' : tile.value}
                      </span>
                      <span className="mt-1.5 text-sm font-semibold leading-snug">
                        {tile.label}
                      </span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {tile.detail}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="antrean-lain-heading" className="grid gap-3">
            <h2 id="antrean-lain-heading" className="font-heading text-lg font-bold">
              Antrean lainnya
            </h2>

            <div className="rounded-card border border-card-edge bg-card p-2 shadow-card">
              <ul className="divide-y divide-divider">
                {secondaryTiles.map((tile) => (
                  <li key={tile.href}>
                    <Link
                      href={tile.href}
                      className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-5"
                        >
                          {ICONS[tile.icon]}
                        </svg>
                      </span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="text-sm font-semibold leading-snug">{tile.label}</span>
                        <span className="text-xs leading-snug text-muted-foreground">
                          {tile.detail}
                        </span>
                      </span>
                      <span className="min-w-8 rounded-full bg-accent px-2.5 py-1 text-center text-sm font-bold text-accent-ink tabular-nums">
                        {tile.value === null ? '—' : tile.value}
                      </span>
                      <ChevronIcon />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <section aria-labelledby="aktivitas-heading" className="grid content-start gap-3">
          <h2 id="aktivitas-heading" className="font-heading text-lg font-bold">
            Aktivitas terbaru
          </h2>

          {!anythingLoaded ? (
            <AdminError
              title="Gagal memuat aktivitas"
              description="Antrean admin tidak dapat dimuat. Coba lagi sebentar."
            />
          ) : recent.length === 0 ? (
            <AdminEmpty
              title="Belum ada aktivitas"
              description="Tidak ada permintaan atau keputusan terbaru di antrean."
            />
          ) : (
            <ol className="rounded-card border border-card-edge bg-card px-4 py-1 shadow-card">
              {recent.map((event) => (
                <li key={event.id} className="border-b border-divider last:border-0">
                  <Link
                    href={event.href}
                    className="flex min-h-11 items-start gap-3 py-3 transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2.5 shrink-0 rounded-full ${SOURCE_DOT[event.source]}`}
                    />
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="text-sm font-medium leading-snug">{event.label}</span>
                      <span className="text-xs break-words leading-snug text-muted-foreground">
                        {event.detail}
                      </span>
                    </span>
                    <time
                      dateTime={event.at}
                      className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                    >
                      {relativeTimeLabel(event.at)}
                    </time>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-muted-foreground"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
