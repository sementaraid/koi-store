import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@koi/ui';
import type { AdminReport } from '@/lib/data/reports';
import {
  formatReportedAt,
  reportDeadlineLabel,
  reportStatusLabel
} from '@/lib/helpers/report-format';
import { activeStrikeLabel, banLabel } from '@/lib/helpers/strike-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaStage,
  DetailSection
} from './DetailDialog';
import { StrikePanel } from './StrikePanel';

export type ReportQueueProps = {
  reports: AdminReport[];
  total: number;
};

// D-079 retired the farmer's non-payment report. This page is now a read-only
// archive of the rows that already exist; the admin raises a new non-payment
// from the Pembayaran pemenang queue instead.
export function ReportQueue({ reports, total }: ReportQueueProps) {
  return (
    <div className="grid gap-3">
      {total > reports.length ? (
        <p className="text-sm text-muted-foreground">
          Menampilkan {reports.length} dari {total} laporan.
        </p>
      ) : null}
      {reports.length === 0 ? (
        <AdminEmpty
          title="Belum ada laporan lama"
          description="Tidak ada laporan petani yang tersimpan. Pantau Pembayaran pemenang untuk lot yang lewat batas."
        />
      ) : (
        <Table label="Arsip laporan belum dibayar" minWidth="64rem">
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Pihak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Batas bayar</TableHead>
              <TableHead>Strike</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ReportRow({ report }: { report: AdminReport }) {
  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-2">
          <p className="font-medium">{report.product.title ?? 'Lot tanpa judul'}</p>
        </div>
      </TableCell>
      <TableCell>
        <p>{report.seller.name || '—'}</p>
        <p className="text-muted-foreground">Pemenang: {report.winner.name || '—'}</p>
      </TableCell>
      <TableCell>
        <div className="grid gap-1">
          <Badge variant="attention">{reportStatusLabel(report.status)}</Badge>
          <span className="text-muted-foreground">
            Dilaporkan {formatReportedAt(report.reported_at)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {reportDeadlineLabel(report.pay_by)}
      </TableCell>
      <TableCell>
        <div className="grid gap-2">
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
              idPrefix={`report-${report.id}`}
            />
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <ReportDetail report={report} />
      </TableCell>
    </TableRow>
  );
}

function ReportDetail({ report }: { report: AdminReport }) {
  return (
    <DetailDialog
      triggerLabel={`Lihat detail ${report.product.title ?? 'laporan'}`}
      title="Detail laporan"
      media={
        report.product.thumbnail ? (
          <DetailMediaStage
            items={[
              {
                src: report.product.thumbnail,
                kind: 'image',
                alt: `Foto lot ${report.product.title ?? ''}`.trim()
              }
            ]}
          />
        ) : null
      }
    >
      {() => (
        <>
          <DetailIdentity
            title={report.product.title ?? 'Lot tanpa judul'}
            badge={<Badge variant="attention">{reportStatusLabel(report.status)}</Badge>}
            secondary={`${report.seller.name || '—'} · Pemenang ${report.winner.name || '—'}`}
          />

          <DetailSection title="Identitas">
            <DetailItem label="Penjual">{report.seller.name || '—'}</DetailItem>
            <DetailItem label="Pemenang">{report.winner.name || '—'}</DetailItem>
            <DetailItem label="Dilaporkan">{formatReportedAt(report.reported_at)}</DetailItem>
            <DetailItem label="Batas bayar">{reportDeadlineLabel(report.pay_by)}</DetailItem>
            <DetailItem label="Strike aktif">
              {activeStrikeLabel(report.active_strikes)}
            </DetailItem>
            <DetailItem label="Blokir">{banLabel(report.banned)}</DetailItem>
          </DetailSection>

          <DetailSection title="Bukti">
            <DetailItem label="Foto lot">
              {report.product.thumbnail ? 'Ada' : 'Tidak ada'}
            </DetailItem>
          </DetailSection>
        </>
      )}
    </DetailDialog>
  );
}
