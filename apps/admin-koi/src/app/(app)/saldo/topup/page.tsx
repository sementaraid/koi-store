import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { TopupQueue } from '@/components/TopupQueue';
import { ROUTES } from '@/const/routes';
import { getTopupQueues } from '@/lib/data/topups';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Permintaan top-up'
};

/** The top-up queue (US-012): screenshot against the bank statement. */
export default async function TopupsRoute() {
  await requireAdmin(ROUTES.topups);
  const queues = await getTopupQueues();

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Permintaan top-up</h1>
        <p className="text-sm text-muted-foreground">
          Cocokkan bukti transfer dengan mutasi bank, lalu setujui atau tolak.
        </p>
      </div>

      {queues ? (
        <TopupQueue pending={queues.pending} decided={queues.decided} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat permintaan top-up</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
