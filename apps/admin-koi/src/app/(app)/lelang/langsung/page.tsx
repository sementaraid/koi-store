import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { LiveAuctions } from '@/components/LiveAuctions';
import { LiveLotPanel } from '@/components/LiveLotPanel';
import { ROUTES } from '@/const/routes';
import { getLiveLot, listLiveAuctions } from '@/lib/data/live-auctions';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pantau lelang'
};

/**
 * The `/lelang/langsung` live monitoring screen (US-072 T-072.2a), with the
 * bid panel (T-072.2b) when `?lot=<id>` is present.
 *
 * @remarks
 * Two reads: the live auctions and their lots, and — only when a lot is
 * selected — that lot's bids. A lot that has since closed still opens
 * read-only, so the audit stays reachable. `now` is the server's clock, so the
 * countdown text matches between the server and client renders.
 */
export default async function LiveAuctionsRoute({
  searchParams
}: {
  searchParams: Promise<{ lot?: string | string[] }>;
}) {
  await requireAdmin(ROUTES.liveAuctions);

  const { lot } = await searchParams;
  const lotId = typeof lot === 'string' && lot ? lot : null;
  const now = new Date().toISOString();
  const [list, detail] = await Promise.all([
    listLiveAuctions(),
    lotId ? getLiveLot(lotId) : Promise.resolve(null)
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-xl font-medium tracking-tight">Pantau lelang</h1>
          <p className="text-sm text-muted-foreground">
            Harga dan jumlah bid tiap lot yang sedang berjalan. Buka satu lot untuk menghapus
            bid yang salah.
          </p>
        </div>
        {/* A plain link, not a timer: the screen refreshes when the operator
            asks, and never polls (T-072.2a). */}
        <Link
          href={lotId ? `${ROUTES.liveAuctions}?lot=${encodeURIComponent(lotId)}` : ROUTES.liveAuctions}
          className="text-sm text-accent-ink underline underline-offset-4"
        >
          Muat ulang
        </Link>
      </div>

      {lotId ? (
        detail ? (
          <div className="grid gap-2">
            <Link
              href={ROUTES.liveAuctions}
              className="text-sm text-accent-ink underline underline-offset-4"
            >
              Kembali ke daftar
            </Link>
            <LiveLotPanel detail={detail} now={now} />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lot tidak ditemukan</CardTitle>
              <CardDescription>
                Lot ini tidak ada atau gagal dimuat. Kembali ke daftar dan pilih lot lain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={ROUTES.liveAuctions}
                className="text-sm text-accent-ink underline underline-offset-4"
              >
                Kembali ke daftar
              </Link>
            </CardContent>
          </Card>
        )
      ) : null}

      {list ? (
        <LiveAuctions auctions={list.auctions} total={list.total} now={now} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat lelang berjalan</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
