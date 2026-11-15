import type { Metadata } from 'next';

import { BalanceCorrection } from '@/components/BalanceCorrection';
import { ROUTES } from '@/const/routes';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Koreksi saldo'
};

/** The balance correction screen (US-013): find a customer, record a signed
    adjustment with a written reason. Existing transactions are never changed
    (AC2) — the backend's workflow only appends. */
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
