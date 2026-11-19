import type { Metadata } from 'next';

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
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Koreksi saldo</h1>
        <p className="text-sm text-muted-foreground">
          Perbaiki kesalahan saldo pelanggan dengan transaksi penyesuaian beralasan.
        </p>
      </div>

      <BalanceCorrection />
    </div>
  );
}
