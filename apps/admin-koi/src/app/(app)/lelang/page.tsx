import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
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
      <AdminPageHeader
        title="Persetujuan lelang"
        description="Periksa kategori, foto lot, dan biaya, lalu setujui atau tolak."
      />

      {queue ? (
        <AuctionQueue auctions={queue.auctions} total={queue.total} />
      ) : (
        <AdminError
          title="Gagal memuat antrean lelang"
          description="Antrean persetujuan lelang tidak dapat dimuat."
        />
      )}
    </div>
  );
}
