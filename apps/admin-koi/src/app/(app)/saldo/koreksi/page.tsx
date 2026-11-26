import type { Metadata } from 'next';

import { AdminPageHeader } from '@/components/AdminPageHeader';
import { BalanceCorrection } from '@/components/BalanceCorrection';
import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Koreksi saldo'
};

export default async function BalanceCorrectionRoute() {
  await requireAdmin(ROUTES.adjustments);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Koreksi saldo"
        description="Perbaiki kesalahan saldo pelanggan dengan transaksi penyesuaian beralasan."
      />

      <BalanceCorrection />
    </div>
  );
}
