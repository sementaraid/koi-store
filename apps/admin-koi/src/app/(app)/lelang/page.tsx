import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { AuctionQueue } from '@/components/AuctionQueue';
import { ROUTES } from '@/const/routes';
import { getAuctionQueue } from '@/lib/data/auctions';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Persetujuan lelang'
};

export default async function AuctionsRoute() {
  await requireAdmin(ROUTES.auctions);
  const queue = await getAuctionQueue();

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Persetujuan lelang</h1>
        <p className="text-sm text-muted-foreground">
          Periksa kategori, foto lot, dan biaya, lalu setujui atau tolak.
        </p>
      </div>

      {queue ? (
        <AuctionQueue auctions={queue.auctions} total={queue.total} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat antrean lelang</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
