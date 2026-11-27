'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
import { RowActions, type RowAction } from './RowActions';

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
  const router = useRouter();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [removeLinkOpen, setRemoveLinkOpen] = useState(false);

  const readOnly = auction.status === 'closed' || auction.status === 'cancelled';
  const sellerName = auction.seller?.name ?? 'lelang ini';

  function done() {
    setApproveOpen(false);
    setRejectOpen(false);
    setLinkOpen(false);
    setRemoveLinkOpen(false);
    router.refresh();
    requestAnimationFrame(() => {
      actionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  }

  const actions: RowAction[] = [
    { label: 'Setujui lelang', onSelect: () => setApproveOpen(true) },
    { label: 'Tolak lelang', onSelect: () => setRejectOpen(true), tone: 'destructive' }
  ];

  if (!readOnly) {
    actions.push({ label: 'Ubah tautan siaran', onSelect: () => setLinkOpen(true) });
    if (auction.live_stream_url) {
      actions.push({
        label: 'Hapus tautan siaran',
        onSelect: () => setRemoveLinkOpen(true),
        tone: 'destructive'
      });
    }
  }

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
        <LiveLinkCell auction={auction} />
      </TableCell>

      <TableCell>
        <AuctionDetail auction={auction} />
      </TableCell>

      <TableCell>
        <div ref={actionsRef} className="inline-flex">
          <RowActions label={`Aksi untuk lelang ${sellerName}`} actions={actions} />
        </div>

        <ApproveAuctionDialog
          auction={auction}
          open={approveOpen}
          onOpenChange={setApproveOpen}
          onDone={done}
        />
        <RejectAuctionDialog
          auction={auction}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          onDone={done}
        />
        <LiveLinkDialog
          auction={auction}
          open={linkOpen}
          onOpenChange={setLinkOpen}
          onDone={done}
        />
        <RemoveLiveLinkDialog
          auction={auction}
          open={removeLinkOpen}
          onOpenChange={setRemoveLinkOpen}
          onDone={done}
        />
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
    reason: z.string().trim().max(500, 'Alasan maksimal 500 karakter')
  })
  .superRefine((data, ctx) => {
    const hasFee = data.listing_fee !== '' || data.join_fee !== '';
    const error = overrideFormError({
      listingFee: data.listing_fee === '' ? null : Number(data.listing_fee),
      joinFee: data.join_fee === '' ? null : Number(data.join_fee),
      reason: data.reason
    });
    if (error) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: error });
      return;
    }
    if (hasFee && data.reason.length < 5) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Alasan minimal 5 karakter' });
    }
  });

type ApproveData = z.infer<typeof approveSchema>;

function ApproveAuctionDialog({
  auction,
  open,
  onOpenChange,
  onDone
}: {
  auction: AdminAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const sellerName = auction.seller?.name ?? 'lelang ini';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ApproveData>({
    resolver: zodResolver(approveSchema),
    defaultValues: { listing_fee: '', join_fee: '', reason: '' }
  });
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: ApproveData) {
    if (isSubmitting) return;
    setError(null);
    const overriding = data.listing_fee !== '' || data.join_fee !== '';
    const result = overriding
      ? await approveAuctionWithOverride(auction.id, {
          ...(data.listing_fee !== '' ? { listing_fee: Number(data.listing_fee) } : {}),
          ...(data.join_fee !== '' ? { join_fee: Number(data.join_fee) } : {}),
          reason: data.reason
        })
      : await approveAuction(auction.id);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success('Lelang disetujui.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Setujui lelang {sellerName}?</DialogTitle>
            <DialogDescription>
              Biaya pasang lelang ditagihkan ke saldo petani. Kosongkan kedua biaya untuk
              memakai tabel biaya, atau isi salah satu untuk mengubah biaya lelang ini.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menyetujui lelang">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              id={`auction-${auction.id}-listing`}
              label={`Biaya listing baru (asal: ${formatRupiah(auction.listing_fee)})`}
              type="number"
              min={0}
              step={1}
              placeholder="Biarkan kosong"
              disabled={isSubmitting}
              error={errors.listing_fee?.message}
              {...register('listing_fee')}
            />
            <FormField
              id={`auction-${auction.id}-join`}
              label={`Biaya ikut baru per lot (asal: ${formatRupiah(auction.join_fee)})`}
              type="number"
              min={0}
              step={1}
              placeholder="Biarkan kosong"
              disabled={isSubmitting}
              error={errors.join_fee?.message}
              {...register('join_fee')}
            />
          </div>

          <FormField
            id={`auction-${auction.id}-reason`}
            label="Alasan perubahan biaya"
            hint="Wajib diisi (minimal 5 karakter) hanya jika mengubah salah satu biaya di atas."
            maxLength={500}
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register('reason')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Ya, setujui'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LiveLinkCell({ auction }: { auction: AdminAuction }) {
  if (!auction.live_stream_url) {
    return <p className="text-sm text-muted-foreground">Belum ada tautan siaran.</p>;
  }

  return (
    <p className="text-sm break-all">
      <a
        href={auction.live_stream_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-ink underline underline-offset-4"
      >
        {auction.live_stream_url}
      </a>
    </p>
  );
}

const liveLinkSchema = z.object({
  live_stream_url: z
    .string()
    .trim()
    .refine(isLiveStreamUrl, 'Tautan harus dari YouTube atau Instagram (https).')
});

type LiveLinkData = z.infer<typeof liveLinkSchema>;

function LiveLinkDialog({
  auction,
  open,
  onOpenChange,
  onDone
}: {
  auction: AdminAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const sellerName = auction.seller?.name ?? 'lelang ini';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<LiveLinkData>({
    resolver: zodResolver(liveLinkSchema),
    defaultValues: { live_stream_url: auction.live_stream_url ?? '' }
  });
  const [error, setError] = useState<string | null>(null);

  // The row can refresh with a new link while the dialog is closed; prefill the
  // current value each time it opens.
  useEffect(() => {
    if (open) reset({ live_stream_url: auction.live_stream_url ?? '' });
  }, [open, auction.live_stream_url, reset]);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) setError(null);
  }

  async function submit(data: LiveLinkData) {
    if (isSubmitting) return;
    setError(null);
    const result = await setAuctionLiveLink(auction.id, data.live_stream_url);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success('Tautan siaran tersimpan.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Ubah tautan siaran {sellerName}?</DialogTitle>
            <DialogDescription>
              Tautan ini tampil di halaman lelang. Hanya YouTube atau Instagram (https). Tidak
              ada video yang diunggah ke {SITE_NAME}.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menyimpan tautan siaran">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`auction-${auction.id}-live-url`}
            label="Tautan YouTube atau Instagram"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/live/…"
            hint="Hanya tautan YouTube atau Instagram (https)."
            disabled={isSubmitting}
            error={errors.live_stream_url?.message}
            {...register('live_stream_url')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan…' : 'Ya, simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveLiveLinkDialog({
  auction,
  open,
  onOpenChange,
  onDone
}: {
  auction: AdminAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const sellerName = auction.seller?.name ?? 'lelang ini';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function changeOpen(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) setError(null);
  }

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await setAuctionLiveLink(auction.id, null);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success('Tautan siaran dihapus.');
    onDone();
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={changeOpen}
      title={`Hapus tautan siaran ${sellerName}?`}
      description={
        <>
          <span>Tautan siaran dihapus dari halaman lelang ini.</span>
          {error ? (
            <span role="alert" className="mt-2 block font-medium text-destructive-ink">
              {error}
            </span>
          ) : null}
        </>
      }
      confirmLabel="Ya, hapus"
      busyLabel="Memproses…"
      destructive
      onConfirm={confirm}
    />
  );
}

const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(500, 'Alasan maksimal 500 karakter')
});

type RejectData = z.infer<typeof rejectSchema>;

function RejectAuctionDialog({
  auction,
  open,
  onOpenChange,
  onDone
}: {
  auction: AdminAuction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const sellerName = auction.seller?.name ?? 'lelang ini';
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RejectData>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' }
  });
  const [error, setError] = useState<string | null>(null);

  function changeOpen(next: boolean) {
    if (isSubmitting) return;
    onOpenChange(next);
    if (!next) {
      setError(null);
      reset();
    }
  }

  async function submit(data: RejectData) {
    if (isSubmitting) return;
    setError(null);
    const result = await rejectAuction(auction.id, data.reason);

    if (!result.success) {
      setError(result.error);
      return;
    }

    reset();
    toast.success('Lelang ditolak.');
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>Tolak lelang {sellerName}?</DialogTitle>
            <DialogDescription>
              Lelang kembali ke draft dan petani harus mengirim ulang. Petani akan membaca
              alasan di bawah ini.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert tone="signal" role="alert" title="Gagal menolak lelang">
              <p className="text-destructive-ink">{error}</p>
            </Alert>
          ) : null}

          <FormField
            id={`auction-${auction.id}-reject-reason`}
            label="Alasan penolakan"
            hint="Minimal 5 karakter, maksimal 500 karakter."
            maxLength={500}
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register('reason')}
          />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={isSubmitting} />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses…' : 'Ya, tolak'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
