'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { CancelAction } from '@/components/CancelAction';
import type { AdminLiveAuction, AdminLiveLot } from '@/lib/data/live-auctions';
import { ROUTES } from '@/const/routes';
import { formatAuctionDate } from '@/lib/helpers/auction-format';
import { lotStatusLabel, lotStatusTone, timeLeftLabel } from '@/lib/helpers/live-bid-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';

export type LiveAuctionsProps = {
  auctions: AdminLiveAuction[];
  total: number;
  now: string;
};

export function lotPanelHref(lotId: string): string {
  return `${ROUTES.liveAuctions}?lot=${encodeURIComponent(lotId)}`;
}

export function LiveAuctions({ auctions, total, now }: LiveAuctionsProps) {
  // After a cancel the list no longer returns the auction (it is no longer
  // `live`), so keep a local "Dibatalkan" card until the next navigation.
  const [cancelled, setCancelled] = useState<AdminLiveAuction[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lelang berjalan ({total})</CardTitle>
        <CardDescription>
          Pantau harga dan jumlah bid tiap lot. Buka satu lot untuk melihat bid dan menghapus
          bid yang salah.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {total > auctions.length ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan {auctions.length} dari {total} lelang berjalan.
          </p>
        ) : null}
        {auctions.length === 0 && cancelled.length === 0 ? (
          <AdminEmpty
            title="Tidak ada lelang yang sedang berjalan"
            description="Lelang yang sudah dimulai muncul di sini."
          />
        ) : (
          auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              now={now}
              onCancelled={() => setCancelled((prev) => [...prev, auction])}
            />
          ))
        )}
        {cancelled.map((auction) => (
          <div key={auction.id} className="grid gap-1 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-medium">{auction.seller?.name ?? '—'}</p>
              <Badge variant="muted">Dibatalkan</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
            </p>
            <p className="text-sm text-muted-foreground">Semua lot ikut dibatalkan.</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AuctionCard({
  auction,
  now,
  onCancelled
}: {
  auction: AdminLiveAuction;
  now: string;
  onCancelled: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <p className="text-base font-medium">{auction.seller?.name ?? '—'}</p>
          <p className="text-sm text-muted-foreground">
            {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
          </p>
        </div>
        {auction.status === 'live' ? (
          <CancelAction kind="auction" id={auction.id} onCancelled={onCancelled} />
        ) : null}
      </div>
      <div className="grid gap-2">
        {auction.lots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lelang ini belum punya lot.</p>
        ) : (
          auction.lots.map((lot) => <LotRow key={lot.id} lot={lot} now={now} />)
        )}
      </div>
    </div>
  );
}

function LotRow({ lot, now }: { lot: AdminLiveLot; now: string }) {
  return (
    <div className="grid gap-2 rounded-md border border-border p-2 text-sm sm:grid-cols-[6rem_1fr]">
      {lot.thumbnail ? (
        /* eslint-disable-next-line @next/next/no-img-element -- backend's own file origin, same as AuctionQueue's lot photos */
        <img
          src={lot.thumbnail}
          alt={lot.title ?? 'Foto lot'}
          className="h-20 w-32 rounded-md border border-border object-cover"
        />
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada foto.</p>
      )}
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{lot.title ?? 'Lot tanpa judul'}</p>
          <Badge variant={lotStatusTone(lot.status)}>{lotStatusLabel(lot.status)}</Badge>
        </div>
        <p className="text-muted-foreground">
          OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)}
        </p>
        <p>
          Harga berjalan <span className="font-medium">{formatRupiah(lot.current_price)}</span> ·{' '}
          {lot.bid_count} bid
        </p>
        <p className="text-muted-foreground">
          Berakhir {formatAuctionDate(lot.end_time)} · {timeLeftLabel(lot.end_time, now)}
        </p>
        {lot.cancel_reason ? (
          <p className="text-muted-foreground">Alasan batal: {lot.cancel_reason}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={lotPanelHref(lot.id)}
            className="text-sm text-accent-ink underline underline-offset-4"
          >
            Lihat bid
          </Link>
          {lot.status === 'open' ? <CancelAction kind="lot" id={lot.id} /> : null}
        </div>
      </div>
    </div>
  );
}
