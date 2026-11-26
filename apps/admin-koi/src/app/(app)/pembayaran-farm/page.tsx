import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { FarmPayoutQueue } from '@/components/FarmPayoutQueue';
import { ROUTES } from '@/const/routes';
import { listFarmPayouts } from '@/lib/data/farm-payouts';
import type { FarmPayoutTab } from '@/lib/helpers/farm-payout-format';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pembayaran ke farm'
};

function parseTab(value: string | undefined): FarmPayoutTab {
  return value === 'pending' || value === 'paid' ? value : 'due';
}

export default async function FarmPayoutsRoute({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin(ROUTES.farmPayouts);

  const { status } = await searchParams;
  const tab = parseTab(status);
  const payouts = await listFarmPayouts(tab);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Pembayaran ke farm"
        description="Transfer ke rekening farm setelah koi diterima atau 3 hari setelah dikirim (WIB). Rekening farm dibuka dengan tombol tampilkan, dan setiap pembukaan tercatat."
      />

      {payouts ? (
        <FarmPayoutQueue payouts={payouts.payouts} total={payouts.count} status={tab} />
      ) : (
        <AdminError
          title="Gagal memuat pembayaran ke farm"
          description="Antrean pembayaran ke farm tidak dapat dimuat."
        />
      )}
    </div>
  );
}
