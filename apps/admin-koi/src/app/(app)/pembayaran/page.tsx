import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { PaymentQueue } from '@/components/PaymentQueue';
import { ROUTES } from '@/const/routes';
import { listWonLotPayments } from '@/lib/data/lot-payments';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pembayaran pemenang'
};

export default async function PaymentsRoute({
  searchParams
}: {
  searchParams: Promise<{ overdue?: string }>;
}) {
  await requireAdmin(ROUTES.payments);

  const { overdue } = await searchParams;
  const overdueOnly = overdue === 'true';
  const payments = await listWonLotPayments(overdueOnly);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Pembayaran pemenang"
        description="Pemenang yang sudah menang dan belum dikonfirmasi membayar ke rekening perusahaan. Batas bayar 1×24 jam setelah lot ditutup (WIB)."
      />

      {payments ? (
        <PaymentQueue
          lots={payments.lots}
          total={payments.count}
          overdueOnly={overdueOnly}
        />
      ) : (
        <AdminError
          title="Gagal memuat pembayaran pemenang"
          description="Antrean pembayaran pemenang tidak dapat dimuat."
        />
      )}
    </div>
  );
}
