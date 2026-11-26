import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { FarmQueue } from '@/components/FarmQueue';
import { ROUTES } from '@/const/routes';
import { getFarmQueues } from '@/lib/data/farms';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pendaftaran kebun'
};

export default async function FarmsRoute() {
  await requireAdmin(ROUTES.farms);
  const queues = await getFarmQueues();

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Pendaftaran kebun"
        description="Periksa KTP, foto kebun, dan nama pemilik rekening, lalu setujui atau tolak."
      />

      {queues ? (
        <FarmQueue
          pending={queues.pending}
          pendingTotal={queues.pendingTotal}
          decided={queues.decided}
        />
      ) : (
        <AdminError
          title="Gagal memuat pendaftaran kebun"
          description="Antrean pendaftaran kebun tidak dapat dimuat."
        />
      )}
    </div>
  );
}
