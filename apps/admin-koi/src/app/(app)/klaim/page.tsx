import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { ClaimQueue } from '@/components/ClaimQueue';
import { ROUTES } from '@/const/routes';
import { listClaims } from '@/lib/data/claims';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Klaim DOA'
};

/**
 * The dead-on-arrival claim queue (US-054 AC3, US-055 AC2).
 *
 * @remarks
 * Three reads, one screen: the disputes the operator has to decide, and the
 * approved/rejected claims as the audit trail. A decided claim leaves the
 * disputed list because the route filters by status, so each tab is the
 * server's answer, never an optimistic flip.
 */
export default async function ClaimsRoute() {
  await requireAdmin(ROUTES.claims);
  const [disputed, approved, rejected] = await Promise.all([
    listClaims('disputed'),
    listClaims('approved'),
    listClaims('rejected')
  ]);

  const decided =
    approved && rejected
      ? [...approved.claims, ...rejected.claims].sort((a, b) =>
          (b.decided_at ?? '').localeCompare(a.decided_at ?? '')
        )
      : null;

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Klaim DOA</h1>
        <p className="text-sm text-muted-foreground">
          Tinjau video unboxing dari pemenang dan putuskan sengketa.
        </p>
      </div>

      {disputed && decided ? (
        <ClaimQueue
          disputed={disputed.claims}
          disputedTotal={disputed.count}
          decided={decided}
        />
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
