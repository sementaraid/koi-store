import type { Metadata } from 'next';

import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
import { ReportQueue } from '@/components/ReportQueue';
import { ROUTES } from '@/const/routes';
import { listReports } from '@/lib/data/reports';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Arsip laporan belum dibayar'
};

// D-079 retired the farmer's report route: this screen is a read-only archive
// of the `lot_report` rows that already exist. New non-payment cases are
// raised from Pembayaran pemenang (payment queue), not here.
export default async function ReportsRoute() {
  await requireAdmin(ROUTES.reports);
  const reports = await listReports('open');

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Arsip laporan belum dibayar"
        description="Laporan lama yang dibuat petani sebelum alur laporan dipensiunkan. Laporan baru tidak dibuat lagi; strike diberikan dari Pembayaran pemenang."
      />

      {reports ? (
        <ReportQueue reports={reports.reports} total={reports.count} />
      ) : (
        <AdminError
          title="Gagal memuat arsip laporan"
          description="Arsip laporan tidak dapat dimuat."
        />
      )}
    </div>
  );
}
