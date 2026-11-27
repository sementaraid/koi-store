'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@koi/ui';
import { CancelAction } from '@/components/CancelAction';
import type { AdminLiveAuction, AdminLiveLot } from '@/lib/data/live-auctions';
import { ROUTES } from '@/const/routes';
import { formatAuctionDate } from '@/lib/helpers/auction-format';
import { lotStatusLabel, lotStatusTone, timeLeftLabel } from '@/lib/helpers/live-bid-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaStage,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';

export type LiveAuctionsProps = {
  auctions: AdminLiveAuction[];
  total: number;
  now: string;
};

export function lotPanelHref(lotId: string): string {
  return `${ROUTES.liveAuctions}?lot=${encodeURIComponent(lotId)}`;
}

export function LiveAuctions({ auctions, total, now }: LiveAuctionsProps) {
  // After a cancel the list no longer returns the auction (it is no longer
  // `live`), so keep a local "Dibatalkan" group until the next navigation.
  const [cancelled, setCancelled] = useState<AdminLiveAuction[]>([]);

  return (
    <div className="grid gap-3">
      {total > auctions.length ? (
        <p className="text-sm text-muted-foreground">
          Menampilkan {auctions.length} dari {total} lelang berjalan.
        </p>
      ) : null}
      {auctions.length === 0 && cancelled.length === 0 ? (
        <AdminEmpty
          title="Tidak ada lelang yang sedang berjalan"
          description="Lelang yang sudah dimulai muncul di sini."
        />
      ) : (
        <Table label="Lelang yang sedang berjalan" minWidth="56rem">
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Berakhir</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          {auctions.map((auction) => (
            <TableBody key={auction.id}>
              <tr className="border-b border-divider bg-muted/40">
                <th scope="rowgroup" colSpan={5} className="px-3 py-2 text-left align-middle">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{auction.seller?.name ?? '—'}</p>
                      <p className="text-xs font-normal text-muted-foreground">
                        {formatAuctionDate(auction.start_at)} –{' '}
                        {formatAuctionDate(auction.end_at)}
                      </p>
                    </div>
                    {auction.status === 'live' ? (
                      <CancelAction
                        kind="auction"
                        id={auction.id}
                        onCancelled={() => setCancelled((prev) => [...prev, auction])}
                      />
                    ) : null}
                  </div>
                </th>
              </tr>
              {auction.lots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-sm text-muted-foreground">
                    Lelang ini belum punya lot.
                  </td>
                </tr>
              ) : (
                auction.lots.map((lot) => (
                  <LotRow key={lot.id} lot={lot} auction={auction} now={now} />
                ))
              )}
            </TableBody>
          ))}
          {cancelled.map((auction) => (
            <TableBody key={`cancelled-${auction.id}`}>
              <tr className="border-b border-divider bg-muted/40 last:border-b-0">
                <th scope="rowgroup" colSpan={5} className="px-3 py-2 text-left align-middle">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{auction.seller?.name ?? '—'}</p>
                    <Badge variant="muted">Dibatalkan</Badge>
                  </div>
                  <p className="text-xs font-normal text-muted-foreground">
                    {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
                  </p>
                  <p className="text-xs font-normal text-muted-foreground">
                    Semua lot ikut dibatalkan.
                  </p>
                </th>
              </tr>
            </TableBody>
          ))}
        </Table>
      )}
    </div>
  );
}

function LotRow({
  lot,
  auction,
  now
}: {
  lot: AdminLiveLot;
  auction: AdminLiveAuction;
  now: string;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{lot.title ?? 'Lot tanpa judul'}</p>
            <Badge variant={lotStatusTone(lot.status)}>{lotStatusLabel(lot.status)}</Badge>
          </div>
          {lot.cancel_reason ? (
            <p className="text-muted-foreground">Alasan batal: {lot.cancel_reason}</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <p className="text-muted-foreground">
          OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)}
        </p>
        <p>
          Harga berjalan <span className="font-medium">{formatRupiah(lot.current_price)}</span> ·{' '}
          {lot.bid_count} bid
        </p>
      </TableCell>
      <TableCell>
        <p>{formatAuctionDate(lot.end_time)}</p>
        <p className="text-muted-foreground">{timeLeftLabel(lot.end_time, now)}</p>
      </TableCell>
      <TableCell>
        <LiveLotDetail lot={lot} auction={auction} now={now} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={lotPanelHref(lot.id)}
            className="text-sm text-accent-ink underline underline-offset-4"
          >
            Lihat bid
          </Link>
          {lot.status === 'open' ? <CancelAction kind="lot" id={lot.id} /> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function LiveLotDetail({
  lot,
  auction,
  now
}: {
  lot: AdminLiveLot;
  auction: AdminLiveAuction;
  now: string;
}) {
  return (
    <DetailDialog
      triggerLabel={`Lihat detail ${lot.title ?? 'lot'}`}
      title="Detail lot"
      media={
        lot.thumbnail ? (
          <DetailMediaStage
            items={[
              {
                src: lot.thumbnail,
                kind: 'image',
                alt: `Foto lot ${lot.title ?? ''}`.trim()
              }
            ]}
          />
        ) : null
      }
    >
      {() => (
        <>
          <DetailIdentity
            title={lot.title ?? 'Lot tanpa judul'}
            badge={
              <Badge variant={lotStatusTone(lot.status)}>{lotStatusLabel(lot.status)}</Badge>
            }
            secondary={`Lelang ${auction.seller?.name ?? '—'} · ${formatAuctionDate(auction.start_at)} – ${formatAuctionDate(auction.end_at)}`}
          />

          <DetailPricePanel
            label="Harga berjalan"
            value={formatRupiah(lot.current_price)}
            note={`OB ${formatRupiah(lot.ob)} · KB ${formatRupiah(lot.kb)} · ${lot.bid_count} bid`}
          />

          <DetailSection title="Jadwal">
            <DetailItem label="Berakhir">{formatAuctionDate(lot.end_time)}</DetailItem>
            <DetailItem label="Sisa waktu">{timeLeftLabel(lot.end_time, now)}</DetailItem>
          </DetailSection>

          {lot.cancel_reason ? (
            <DetailSection title="Catatan">
              <DetailItem label="Alasan batal">{lot.cancel_reason}</DetailItem>
            </DetailSection>
          ) : null}
        </>
      )}
    </DetailDialog>
  );
}
