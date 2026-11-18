import Link from 'next/link';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import type { AdminLiveAuction, AdminLiveLot } from '@/lib/data/live-auctions';
import { ROUTES } from '@/const/routes';
import { formatAuctionDate } from '@/lib/helpers/auction-format';
import { lotStatusLabel, lotStatusTone, timeLeftLabel } from '@/lib/helpers/live-bid-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

/** Props for {@link LiveAuctions}. */
export type LiveAuctionsProps = {
  /** Only `live` auctions, newest start first. */
  auctions: AdminLiveAuction[];
  /** How many are live in total; may exceed `auctions.length`. */
  total: number;
  /** The server's clock, so every countdown reads the same on both renders. */
  now: string;
};

/** Where a lot's panel lives; the list page reads `?lot=<id>`. */
export function lotPanelHref(lotId: string): string {
  return `${ROUTES.liveAuctions}?lot=${encodeURIComponent(lotId)}`;
}

/**
 * The `/lelang/langsung` monitoring list (US-072 T-072.2a): every live auction
 * with its seller and window, and its lots with price, time left, status and
 * bid count. Each lot links to its bid panel (T-072.2b).
 *
 * @remarks
 * Read-only and no polling. No bidder data on this screen (D-042/D-052) — the
 * names live in the panel, one lot at a time.
 */
export function LiveAuctions({ auctions, total, now }: LiveAuctionsProps) {
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
        {auctions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada lelang yang sedang berjalan.</p>
        ) : (
          auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} now={now} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** One live auction: seller, window, then its lots. */
function AuctionCard({ auction, now }: { auction: AdminLiveAuction; now: string }) {
  return (
    <div className="grid gap-2 rounded-md border border-border p-3">
      <div className="grid gap-1">
        <p className="text-base font-medium">{auction.seller?.name ?? '—'}</p>
        <p className="text-sm text-muted-foreground">
          {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
        </p>
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

/** One lot row: photo, title, OB/KB, current price, time left, status, bids. */
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
        <div>
          <Link
            href={lotPanelHref(lot.id)}
            className="text-sm text-accent-ink underline underline-offset-4"
          >
            Lihat bid
          </Link>
        </div>
      </div>
    </div>
  );
}
