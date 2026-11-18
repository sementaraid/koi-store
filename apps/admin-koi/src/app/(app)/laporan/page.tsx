import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@koi/ui';
import { ReportQueue } from '@/components/ReportQueue';
import { ROUTES } from '@/const/routes';
import { listReports } from '@/lib/data/reports';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Laporan belum dibayar'
};

/**
 * The unpaid-winner report queue (US-058 AC1, admin half).
 *
 * @remarks
 * One read: the open reports the backend keeps. Read-only — the strike is
 * US-059's — so there is nothing to decide on this screen.
 */
export default async function ReportsRoute() {
  await requireAdmin(ROUTES.reports);
  const reports = await listReports('open');

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Laporan belum dibayar</h1>
        <p className="text-sm text-muted-foreground">
          Petani melaporkan pemenang yang tidak membayar dalam batas waktu. Tinjau
          laporannya di sini.
        </p>
      </div>

      {reports ? (
        <ReportQueue reports={reports.reports} total={reports.count} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat laporan</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
