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

/** Props for {@link ReportQueue}. */
export type ReportQueueProps = {
  /** Open unpaid-winner reports, oldest first. */
  reports: AdminReport[];
  /** How many are open in total; may exceed `reports.length`. */
  total: number;
};

/**
 * The `/laporan` queue (US-058 AC1, admin half; US-059 T-059.2): what the
 * farmer reported, with the lot, the farm and the winner, and the strike the
 * admin can give from the row.
 *
 * @remarks
 * A report never changes the lot (D-026). The strike is given as
 * `winner_unpaid` off the row's `lot_id` — the backend resolves that lot's
 * winner, so the screen never names the account. Names only — no phone or
 * address reaches this page (D-042/D-052).
 */
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

/** One report: the lot, the farm, the winner, both timestamps, and the strike
    action for the winner (US-059 T-059.2). */
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
        {/* A lot with no winner cannot take a winner strike: the backend
            sends `winner.id` as "" for that impossible row (T-059.1a). */}
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
