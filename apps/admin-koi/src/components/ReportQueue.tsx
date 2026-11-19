import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@koi/ui';
import type { AdminReport } from '@/lib/data/reports';
import {
  formatReportedAt,
  reportDeadlineLabel,
  reportStatusLabel
} from '@/lib/helpers/report-format';
import { activeStrikeLabel, banLabel } from '@/lib/helpers/strike-format';

import { StrikePanel } from './StrikePanel';

export type ReportQueueProps = {
  reports: AdminReport[];
  total: number;
};

export function ReportQueue({ reports, total }: ReportQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan belum dibayar</CardTitle>
        <CardDescription>
          Pemenang tidak membayar dalam 1×24 jam setelah lot ditutup.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {total > reports.length ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan {reports.length} dari {total} laporan. Tindak lanjuti yang di atas
            untuk melihat sisanya.
          </p>
        ) : null}
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada laporan.</p>
        ) : (
          reports.map((report) => <ReportRow key={report.id} report={report} />)
        )}
      </CardContent>
    </Card>
  );
}

function ReportRow({ report }: { report: AdminReport }) {
  return (
    <div className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
      {report.product.thumbnail ? (
        /* eslint-disable-next-line @next/next/no-img-element -- backend's own file origin, same as AuctionQueue's lot photos */
        <img
          src={report.product.thumbnail}
          alt={report.product.title ?? 'Foto lot'}
          className="h-24 w-32 rounded-md border border-border object-cover"
        />
      ) : null}
      <div className="grid gap-1 text-sm">
        <p className="text-base font-medium">
          {report.product.title ?? 'Lot tanpa judul'}
        </p>
        <p className="text-muted-foreground">
          {report.seller.name || '—'} · Pemenang: {report.winner.name || '—'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="attention">{reportStatusLabel(report.status)}</Badge>
          <span className="text-muted-foreground">
            Dilaporkan {formatReportedAt(report.reported_at)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{reportDeadlineLabel(report.pay_by)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={report.active_strikes >= 2 ? 'urgent' : 'muted'}>
            {activeStrikeLabel(report.active_strikes)}
          </Badge>
          <Badge variant={report.banned ? 'urgent' : 'neutral'}>{banLabel(report.banned)}</Badge>
        </div>
        {report.winner.id ? (
          <StrikePanel
            defaultReasonType="winner_unpaid"
            customerId={report.winner.customer_id}
            target={
              report.winner.customer_id
                ? { customer_id: report.winner.customer_id }
                : { lot_id: report.lot_id }
            }
          />
        ) : null}
      </div>
    </div>
  );
}
