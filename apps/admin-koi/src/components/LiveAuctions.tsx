'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from '@koi/ui';
import type { AdminLiveAuction, AdminLiveLot } from '@/lib/data/live-auctions';
import { cancelAuction, cancelLot } from '@/lib/data/live-auctions';
import { ROUTES } from '@/const/routes';
import { formatAuctionDate } from '@/lib/helpers/auction-format';
import { cancelAuctionToast, lotStatusLabel, lotStatusTone, timeLeftLabel } from '@/lib/helpers/live-bid-format';
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

const COPY = {
  lot: {
    button: 'Batalkan lot',
    title: 'Batalkan lot?',
    consequence:
      'Lot tidak bisa dibuka lagi. Peserta yang sudah ikut tidak otomatis dikembalikan kecuali lelangnya dibatalkan.',
    reasonLabel: 'Alasan pembatalan lot',
    confirm: 'Ya, batalkan lot'
  },
  auction: {
    button: 'Batalkan lelang',
    title: 'Batalkan lelang?',
    consequence:
      'Semua biaya ikut lelang dikembalikan ke saldo peserta. Biaya pasang lelang tidak dikembalikan. Semua lot yang masih terbuka ikut dibatalkan.',
    reasonLabel: 'Alasan pembatalan lelang',
    confirm: 'Ya, batalkan lelang'
  }
} as const;

const REASON_SCHEMA = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(500, 'Alasan maksimal 500 karakter')
});

type ReasonData = z.infer<typeof REASON_SCHEMA>;

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
                      <CancelControl
                        kind="auction"
                        id={auction.id}
                        recordLabel={auction.seller?.name ?? 'lelang ini'}
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
          {lot.status === 'open' ? (
            <CancelControl kind="lot" id={lot.id} recordLabel={lot.title ?? 'lot ini'} />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

/* One dialog carries the consequence and the required reason, so it is the
   confirmation. Nothing is written until "Ya, batalkan…" is pressed. */
function CancelControl({
  kind,
  id,
  recordLabel,
  onCancelled
}: {
  kind: 'lot' | 'auction';
  id: string;
  recordLabel: string;
  onCancelled?: () => void;
}) {
  /* Deterministic, not `useId`: same id in the server HTML and the client. */
  const uid = `cancel-${kind}-${id}`;
  const copy = COPY[kind];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReasonData>({
    resolver: zodResolver(REASON_SCHEMA),
    defaultValues: { reason: '' }
  });

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    setOpen(next);
    if (!next) {
      setApiError(null);
      reset();
    }
  }

  async function submit(data: ReasonData) {
    if (isSubmitting) return;
    setApiError(null);

    if (kind === 'lot') {
      const result = await cancelLot(id, data.reason);
      if (!result.success) {
        setApiError(result.error);
        return;
      }
      toast.success('Lot dibatalkan. Lot ini tidak bisa dibuka lagi.');
    } else {
      const result = await cancelAuction(id, data.reason);
      if (!result.success) {
        setApiError(result.error);
        return;
      }
      toast.success(cancelAuctionToast(result.refund, formatRupiah));
      onCancelled?.();
    }

    setOpen(false);
    reset();
    router.refresh();
  }

  const error = errors.reason?.message;
  const describedBy = error ? `${uid}-hint ${uid}-error` : `${uid}-hint`;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size={kind === 'lot' ? 'xs' : 'sm'} />
        }
      >
        {copy.button}
      </DialogTrigger>
      <DialogContent showCloseButton={!isSubmitting}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>
              Berlaku untuk {recordLabel}. {copy.consequence}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`${uid}-reason`}>{copy.reasonLabel}</Label>
            <Textarea
              id={`${uid}-reason`}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              {...register('reason')}
            />
            <p id={`${uid}-hint`} className="text-xs text-muted-foreground">
              Wajib diisi, 5–500 karakter. Tersimpan sebagai catatan audit.
            </p>
            {error ? (
              <p id={`${uid}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <Alert tone="signal" role="alert" title="Gagal membatalkan">
              {apiError}
            </Alert>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" disabled={isSubmitting} />}
            >
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
