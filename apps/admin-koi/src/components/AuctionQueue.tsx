'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Badge,
  Button,
  FormField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@koi/ui';
import {
  approveAuction,
  approveAuctionWithOverride,
  rejectAuction,
  setAuctionLiveLink,
  type AdminAuction,
  type AuctionLot
} from '@/lib/data/auctions';
import {
  auctionFeeTotal,
  deliveryMethodLabel,
  formatAuctionDate,
  overrideFormError
} from '@/lib/helpers/auction-format';
import { SITE_NAME } from '@/const/site';
import { feeCategoryLabel } from '@/lib/helpers/fee-category-label';
import { isLiveStreamUrl } from '@/lib/helpers/live-stream-url';
import { formatRupiah } from '@/lib/helpers/topup-format';

import { AdminEmpty } from './AdminEmpty';
import { ConfirmDialog } from './ConfirmDialog';
import {
  DetailDialog,
  DetailIdentity,
  DetailItem,
  DetailMediaStage,
  DetailPricePanel,
  DetailSection
} from './DetailDialog';

export type AuctionQueueProps = {
  auctions: AdminAuction[];
  total: number;
};

export function AuctionQueue({ auctions, total }: AuctionQueueProps) {
  return (
    <div className="grid gap-3">
      {total > auctions.length ? (
        <p className="text-sm text-muted-foreground">
          Menampilkan {auctions.length} dari {total} lelang. Selesaikan yang di atas untuk
          melihat sisanya.
        </p>
      ) : null}
      {auctions.length === 0 ? (
        <AdminEmpty
          title="Tidak ada lelang yang menunggu persetujuan"
          description="Lelang baru muncul di sini setelah petani mengirimnya."
        />
      ) : (
        <Table label="Lelang yang menunggu persetujuan" minWidth="80rem">
          <TableHeader>
            <TableRow>
              <TableHead>Lelang</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Tautan siaran</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auctions.map((auction) => (
              <AuctionRow key={auction.id} auction={auction} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function AuctionRow({ auction }: { auction: AdminAuction }) {
  const [busy, setBusy] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{auction.seller?.name ?? '—'}</p>
        <p className="text-muted-foreground">
          {auction.fee_category
            ? feeCategoryLabel(auction.fee_category.name)
            : 'Kategori tidak ditemukan'}{' '}
          · {deliveryMethodLabel(auction.delivery_method)} · {auction.lots.length} lot
        </p>
        <p className="text-muted-foreground">
          {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
        </p>
      </TableCell>

      <TableCell>
        <ul className="grid gap-1">
          <li>Biaya listing: {formatRupiah(auction.listing_fee)}</li>
          <li>Biaya ikut per lot: {formatRupiah(auction.join_fee)}</li>
          <li className="font-medium">
            Total: {formatRupiah(auctionFeeTotal(auction.listing_fee, auction.join_fee))}
          </li>
        </ul>
      </TableCell>

      <TableCell>
        <div className="grid gap-2">
          {auction.lots.map((lot) => (
            <LotSummary key={lot.id} lot={lot} />
          ))}
        </div>
      </TableCell>

      <TableCell>
        <LiveLinkControl auction={auction} />
      </TableCell>

      <TableCell>
        <AuctionDetail auction={auction} />
      </TableCell>

      <TableCell>
        <div className="grid gap-3">
          <ApproveForm auction={auction} busy={busy} onBusyChange={setBusy} />
          <RejectForm id={auction.id} busy={busy} onBusyChange={setBusy} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function LotSummary({ lot }: { lot: AuctionLot }) {
  return (
    <div className="grid gap-1 text-sm">
      <p className="font-medium">{lot.title ?? 'Lot tanpa judul'}</p>
      <p className="text-muted-foreground">
        OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)}
      </p>
    </div>
  );
}

function AuctionDetail({ auction }: { auction: AdminAuction }) {
  const photos = auction.lots.flatMap((lot) =>
    lot.photos.map((url) => ({
      src: url,
      kind: 'image' as const,
      alt: `Foto lot ${lot.title ?? 'tanpa judul'}`
    }))
  );
  const category = auction.fee_category
    ? feeCategoryLabel(auction.fee_category.name)
    : 'Kategori tidak ditemukan';

  return (
    <DetailDialog
      triggerLabel={`Lihat detail lelang ${auction.seller?.name ?? auction.id}`}
      title="Detail lelang"
      media={photos.length > 0 ? <DetailMediaStage items={photos} /> : null}
    >
      {() => (
        <>
          <DetailIdentity
            title={auction.seller?.name ?? 'Lelang'}
            badge={<Badge variant="warning">Menunggu persetujuan</Badge>}
            secondary={`${category} · ${deliveryMethodLabel(auction.delivery_method)} · ${auction.lots.length} lot`}
          />

          <DetailPricePanel
            label="Total biaya"
            value={formatRupiah(auctionFeeTotal(auction.listing_fee, auction.join_fee))}
            note={`Listing ${formatRupiah(auction.listing_fee)} · Ikut per lot ${formatRupiah(auction.join_fee)}`}
          />

          <DetailSection title="Jadwal">
            <DetailItem label="Mulai">{formatAuctionDate(auction.start_at)}</DetailItem>
            <DetailItem label="Berakhir">{formatAuctionDate(auction.end_at)}</DetailItem>
            <DetailItem label="Jendela perpanjangan">
              {auction.extend_window_minutes} menit
            </DetailItem>
          </DetailSection>

          <DetailSection title="Lot">
            {auction.lots.length === 0 ? (
              <DetailItem label="Lot">Lelang ini belum punya lot.</DetailItem>
            ) : (
              auction.lots.map((lot, lotIndex) => (
                <DetailItem key={lot.id} label={`Lot ${lotIndex + 1}`}>
                  <span className="font-medium">{lot.title ?? 'Lot tanpa judul'}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)} · Harga berjalan{' '}
                    {formatRupiah(lot.current_price)}
                  </span>
                  {lot.cancel_reason ? (
                    <span className="block text-sm font-normal text-muted-foreground">
                      Alasan batal: {lot.cancel_reason}
                    </span>
                  ) : null}
                </DetailItem>
              ))
            )}
          </DetailSection>

          <DetailSection title="Siaran">
            <DetailItem label="Tautan siaran">
              {auction.live_stream_url ? (
                <a
                  href={auction.live_stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-accent-ink underline underline-offset-4"
                >
                  {auction.live_stream_url}
                </a>
              ) : (
                'Belum ada tautan siaran'
              )}
            </DetailItem>
          </DetailSection>

          {auction.fee_override_reason || auction.rejection_reason ? (
            <DetailSection title="Catatan">
              {auction.fee_override_reason ? (
                <DetailItem label="Alasan ubah biaya">{auction.fee_override_reason}</DetailItem>
              ) : null}
              {auction.rejection_reason ? (
                <DetailItem label="Alasan penolakan">{auction.rejection_reason}</DetailItem>
              ) : null}
            </DetailSection>
          ) : null}
        </>
      )}
    </DetailDialog>
  );
}

const feeField = z
  .string()
  .refine((value) => value === '' || /^\d+$/.test(value), 'Harus bilangan bulat, tidak boleh negatif');

const approveSchema = z
  .object({
    listing_fee: feeField,
    join_fee: feeField,
    reason: z.string()
  })
  .superRefine((data, ctx) => {
    const error = overrideFormError({
      listingFee: data.listing_fee === '' ? null : Number(data.listing_fee),
      joinFee: data.join_fee === '' ? null : Number(data.join_fee),
      reason: data.reason
    });
    if (error) ctx.addIssue({ code: 'custom', path: ['reason'], message: error });
  });

type ApproveData = z.infer<typeof approveSchema>;

function ApproveForm({
  auction,
  busy,
  onBusyChange
}: {
  auction: AdminAuction;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ApproveData>({
    resolver: zodResolver(approveSchema),
    defaultValues: { listing_fee: '', join_fee: '', reason: '' }
  });
  const [pending, setPending] = useState<{ data: ApproveData; overriding: boolean } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(data: ApproveData) {
    const overriding = data.listing_fee !== '' || data.join_fee !== '';
    setPending({ data, overriding });
    setConfirmOpen(true);
  }

  async function confirmApprove() {
    if (!pending) return;
    const { data, overriding } = pending;

    onBusyChange(true);
    const result = overriding
      ? await approveAuctionWithOverride(auction.id, {
          ...(data.listing_fee !== '' ? { listing_fee: Number(data.listing_fee) } : {}),
          ...(data.join_fee !== '' ? { join_fee: Number(data.join_fee) } : {}),
          reason: data.reason
        })
      : await approveAuction(auction.id);
    onBusyChange(false);
    setConfirmOpen(false);
    setPending(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Lelang disetujui.');
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <h3 className="text-sm font-medium">Setujui</h3>
      <p className="text-xs text-muted-foreground">
        Kosongkan kedua biaya untuk menyetujui sesuai tabel biaya. Isi salah satu untuk mengubah
        biaya khusus lelang ini — alasan wajib diisi.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField
          id={`auction-${auction.id}-listing`}
          label={`Biaya listing baru (asal: ${formatRupiah(auction.listing_fee)})`}
          type="number"
          min={0}
          step={1}
          placeholder="Biarkan kosong"
          {...register('listing_fee')}
        />
        <FormField
          id={`auction-${auction.id}-join`}
          label={`Biaya ikut baru per lot (asal: ${formatRupiah(auction.join_fee)})`}
          type="number"
          min={0}
          step={1}
          placeholder="Biarkan kosong"
          {...register('join_fee')}
        />
      </div>
      <FormField
        id={`auction-${auction.id}-reason`}
        label="Alasan perubahan biaya"
        hint="Wajib diisi hanya jika mengubah salah satu biaya di atas."
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div>
        <Button type="submit" size="sm" disabled={isSubmitting || busy}>
          {isSubmitting ? 'Menyetujui…' : 'Setujui lelang'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Setujui lelang?"
        description={
          pending?.overriding
            ? 'Setujui lelang ini dengan biaya yang diubah dan tagih biaya listing?'
            : 'Setujui lelang ini dan tagih biaya listing sesuai tabel biaya?'
        }
        confirmLabel="Setujui lelang"
        busyLabel="Menyetujui…"
        onConfirm={confirmApprove}
      />
    </form>
  );
}

const liveLinkSchema = z.object({
  live_stream_url: z
    .string()
    .trim()
    .refine(isLiveStreamUrl, 'Tautan harus dari YouTube atau Instagram (https).')
});

type LiveLinkData = z.infer<typeof liveLinkSchema>;

function LiveLinkControl({ auction }: { auction: AdminAuction }) {
  const [stored, setStored] = useState<string | null>(auction.live_stream_url);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LiveLinkData>({
    resolver: zodResolver(liveLinkSchema),
    defaultValues: { live_stream_url: auction.live_stream_url ?? '' }
  });

  const readOnly = auction.status === 'closed' || auction.status === 'cancelled';

  async function save(url: string | null, successMessage: string) {
    setBusy(true);
    const result = await setAuctionLiveLink(auction.id, url);
    setBusy(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setStored(result.live_stream_url);
    toast.success(successMessage);
    reset({ live_stream_url: '' });
  }

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">Tautan siaran</h3>
      {stored ? (
        <p className="text-sm break-all">
          <a
            href={stored}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-ink underline underline-offset-4"
          >
            {stored}
          </a>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada tautan siaran.</p>
      )}

      {readOnly ? null : (
        <form
          onSubmit={handleSubmit((data) => save(data.live_stream_url, 'Tautan siaran tersimpan.'))}
          className="grid gap-2"
          noValidate
        >
          <FormField
            id={`auction-${auction.id}-live-url`}
            label="Tautan YouTube atau Instagram"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/live/…"
            hint={`Hanya tautan YouTube atau Instagram (https). Tidak ada video yang diunggah ke ${SITE_NAME}.`}
            error={errors.live_stream_url?.message}
            {...register('live_stream_url')}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting || busy}>
              {isSubmitting ? 'Menyimpan…' : 'Simpan tautan'}
            </Button>
            {stored ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting || busy}
                onClick={() => save(null, 'Tautan siaran dihapus.')}
              >
                Hapus tautan
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}

const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Masukkan alasan penolakan')
});

type RejectData = z.infer<typeof rejectSchema>;

function RejectForm({
  id,
  busy,
  onBusyChange
}: {
  id: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RejectData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' }
  });
  const [pendingReason, setPendingReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  function submit(data: RejectData) {
    setPendingReason(data.reason);
    setConfirmOpen(true);
  }

  async function confirmReject() {
    onBusyChange(true);
    const result = await rejectAuction(id, pendingReason);
    onBusyChange(false);
    setConfirmOpen(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Lelang ditolak.');
    setPendingReason('');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2" noValidate>
      <h3 className="text-sm font-medium">Tolak</h3>
      <FormField
        id={`auction-${id}-reject-reason`}
        label="Alasan penolakan"
        hint="Petani akan membaca alasan ini, memperbaiki, dan mengirim ulang."
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div>
        <Button type="submit" variant="destructive" size="sm" disabled={isSubmitting || busy}>
          {isSubmitting ? 'Menolak…' : 'Tolak lelang'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Tolak lelang?"
        description="Tolak lelang ini? Lelang kembali ke draft dan petani harus mengirim ulang."
        confirmLabel="Tolak lelang"
        busyLabel="Menolak…"
        destructive
        onConfirm={confirmReject}
      />
    </form>
  );
}
