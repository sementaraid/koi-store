import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@koi/ui';
import { AdminEmpty } from '@/components/AdminEmpty';
import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { LiveAuctions } from '@/components/LiveAuctions';
import { LiveLotPanel } from '@/components/LiveLotPanel';
import { ROUTES } from '@/const/routes';
import { getLiveLot, listLiveAuctions } from '@/lib/data/live-auctions';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pantau lelang'
};

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
      <AdminPageHeader
        title="Pantau lelang"
        description="Harga dan jumlah bid tiap lot yang sedang berjalan. Buka satu lot untuk menghapus bid yang salah."
        actions={
          <Link
            href={
              lotId ? `${ROUTES.liveAuctions}?lot=${encodeURIComponent(lotId)}` : ROUTES.liveAuctions
            }
            className="text-sm text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Muat ulang
          </Link>
        }
      />

      {lotId ? (
        detail ? (
          <div className="grid gap-2">
            <Link
              href={ROUTES.liveAuctions}
              className="text-sm text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Kembali ke daftar
            </Link>
            <LiveLotPanel detail={detail} now={now} />
          </div>
        ) : (
          <AdminEmpty
            title="Lot tidak ditemukan"
            description="Lot ini tidak ada atau gagal dimuat. Kembali ke daftar dan pilih lot lain."
            action={
              <Button render={<Link href={ROUTES.liveAuctions} />} variant="outline">
                Kembali ke daftar
              </Button>
            }
          />
        )
      ) : null}

      {list ? (
        <LiveAuctions auctions={list.auctions} total={list.total} now={now} />
      ) : (
        <AdminError
          title="Gagal memuat lelang berjalan"
          description="Daftar lelang yang sedang berjalan tidak dapat dimuat."
        />
      )}
    </div>
  );
}
