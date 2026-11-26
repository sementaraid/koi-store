import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { ClaimQueue } from '@/components/ClaimQueue';
import { ROUTES } from '@/const/routes';
import { listClaims } from '@/lib/data/claims';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Klaim DOA'
};

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
      <AdminPageHeader
        title="Klaim DOA"
        description="Tinjau video unboxing dari pemenang dan putuskan sengketa."
      />

      {disputed && decided ? (
        <ClaimQueue
          disputed={disputed.claims}
          disputedTotal={disputed.count}
          decided={decided}
          now={new Date().toISOString()}
        />
      ) : (
        <AdminError
          title="Gagal memuat klaim DOA"
          description="Antrean klaim tidak dapat dimuat."
        />
      )}
    </div>
  );
}
