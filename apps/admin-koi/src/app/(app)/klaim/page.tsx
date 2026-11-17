import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { ClaimQueue } from '@/components/ClaimQueue';
import { ROUTES } from '@/const/routes';
import { listClaims } from '@/lib/data/claims';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Klaim DOA'
};

/** The open dead-on-arrival claim queue (US-054 AC3). Read-only until US-055. */
export default async function ClaimsRoute() {
  await requireAdmin(ROUTES.claims);
  const list = await listClaims('open');

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Klaim DOA</h1>
        <p className="text-sm text-muted-foreground">
          Tinjau video unboxing dari pemenang dan putuskan sengketa.
        </p>
      </div>

      {list ? (
        <ClaimQueue claims={list.claims} total={list.count} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat klaim DOA</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
