import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { TopupQueue } from '@/components/TopupQueue';
import { ROUTES } from '@/const/routes';
import { getTopupQueues } from '@/lib/data/topups';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Permintaan top-up'
};

export default async function TopupsRoute() {
  await requireAdmin(ROUTES.topups);
  const queues = await getTopupQueues();

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Permintaan top-up"
        description="Cocokkan bukti transfer dengan mutasi bank, lalu setujui atau tolak."
      />

      {queues ? (
        <TopupQueue pending={queues.pending} decided={queues.decided} />
      ) : (
        <AdminError
          title="Gagal memuat permintaan top-up"
          description="Antrean permintaan top-up tidak dapat dimuat."
        />
      )}
    </div>
  );
}
