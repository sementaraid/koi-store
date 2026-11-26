'use client';

import { Badge } from '@koi/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@koi/ui/primitives/tabs';

import { StrikePanel } from '@/components/StrikePanel';
import type { UserReportList } from '@/lib/data/accounts';
import { formatReportedAt } from '@/lib/helpers/report-format';

import { AdminEmpty } from './AdminEmpty';
import { AdminError } from './AdminError';

// US-070 T-070.2c (US-058 T-058.4b, US-059): the user page's Strike and Laporan
// tabs. No new strike UI: US-059's StrikePanel is mounted as-is.
export function AccountTabs({
  customerId,
  reports
}: {
  customerId: string;
  reports: UserReportList | null;
}) {
  return (
    <Tabs defaultValue="strike" className="gap-4">
      <TabsList>
        <TabsTrigger value="strike">Strike</TabsTrigger>
        <TabsTrigger value="laporan">
          {reports ? `Laporan (${reports.count})` : 'Laporan'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="strike" className="grid gap-3">
        <StrikePanel
          defaultReasonType="winner_unpaid"
          customerId={customerId}
          target={{ customer_id: customerId }}
          idPrefix={`account-${customerId}`}
        />
      </TabsContent>

      <TabsContent value="laporan" className="grid gap-3">
        {reports === null ? (
          <AdminError
            title="Gagal memuat laporan"
            description="Riwayat laporan akun ini tidak dapat dimuat."
          />
        ) : reports.reports.length === 0 ? (
          <AdminEmpty
            title="Belum ada laporan untuk akun ini"
            description="Laporan lama yang tersimpan akan muncul di sini."
          />
        ) : (
          <>
            {reports.count > reports.reports.length ? (
              <p className="text-sm text-muted-foreground">
                Menampilkan {reports.reports.length} dari {reports.count} laporan.
              </p>
            ) : null}
            {reports.reports.map((report) => (
              <div key={report.id} className="grid gap-1 rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{report.product.title ?? 'Lot tanpa judul'}</p>
                  <Badge variant="attention">Terbuka</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dilaporkan {formatReportedAt(report.reported_at)} · Penjual:{' '}
                  {report.seller.name || '—'}
                </p>
              </div>
            ))}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
