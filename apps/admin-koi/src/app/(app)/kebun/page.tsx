import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
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
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Pendaftaran kebun</h1>
        <p className="text-sm text-muted-foreground">
          Periksa KTP, foto kebun, dan nama pemilik rekening, lalu setujui atau tolak.
        </p>
      </div>

      {queues ? (
        <FarmQueue
          pending={queues.pending}
          pendingTotal={queues.pendingTotal}
          decided={queues.decided}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat pendaftaran kebun</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
