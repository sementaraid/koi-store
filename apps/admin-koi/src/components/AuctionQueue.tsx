'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField } from '@koi/ui';
import {
  approveAuction,
  approveAuctionWithOverride,
  rejectAuction,
  type AdminAuction,
  type AuctionLot
} from '@/lib/data/auctions';
import {
  auctionFeeTotal,
  deliveryMethodLabel,
  formatAuctionDate,
  overrideFormError
} from '@/lib/helpers/auction-format';
import { formatRupiah } from '@/lib/helpers/topup-format';

/** Props for {@link AuctionQueue}. */
export type AuctionQueueProps = {
  /** Auctions waiting on a decision, oldest `updated_at` first. */
  auctions: AdminAuction[];
  /** How many are waiting in total; may exceed `auctions.length`. */
  total: number;
};

/**
 * The `/lelang` approval queue (US-032): category, lots with photos, and fees
 * for every `pending_approval` auction, then approve (at the recomputed fee or
 * an override with a reason) or reject with a reason.
 *
 * @remarks
 * One flat list, not tabs like the farm queue: a decided auction leaves this
 * status entirely (`scheduled` or `draft`), so there is no "decided" list to
 * split off here — it never shows again (US-032 AC5, D-031).
 */
export function AuctionQueue({ auctions, total }: AuctionQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Persetujuan lelang ({total})</CardTitle>
        <CardDescription>
          Periksa kategori, foto tiap lot, dan biaya sebelum menyetujui atau menolak.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {total > auctions.length ? (
          <p className="text-sm text-muted-foreground">
            Menampilkan {auctions.length} dari {total} lelang. Selesaikan yang di atas untuk
            melihat sisanya.
          </p>
        ) : null}
        {auctions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada lelang yang menunggu persetujuan.</p>
        ) : (
          auctions.map((auction) => <AuctionRow key={auction.id} auction={auction} />)
        )}
      </CardContent>
    </Card>
  );
}

/** One pending auction: its facts, every lot, then the two decisions. */
function AuctionRow({ auction }: { auction: AdminAuction }) {
  /* One decision at a time per row, same reason as the farm queue's
     `PendingRow`: approving while a rejection is on the wire is two answers to
     one question. */
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-3 rounded-md border border-border p-3">
      <div className="grid gap-1 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4">
        <p className="text-base font-medium">{auction.seller?.name ?? '—'}</p>
        <div className="grid gap-0.5 text-sm">
          <p className="text-muted-foreground">
            {auction.fee_category?.name ?? 'Kategori tidak ditemukan'} ·{' '}
            {deliveryMethodLabel(auction.delivery_method)} · {auction.lots.length} lot
          </p>
          <p className="text-muted-foreground">
            {formatAuctionDate(auction.start_at)} – {formatAuctionDate(auction.end_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-1 rounded-md border border-border p-2 text-sm sm:grid-cols-3">
        <p>Biaya listing: {formatRupiah(auction.listing_fee)}</p>
        <p>Biaya join: {formatRupiah(auction.join_fee)}</p>
        <p className="font-medium">
          Total: {formatRupiah(auctionFeeTotal(auction.listing_fee, auction.join_fee))}
        </p>
      </div>

      <div className="grid gap-2">
        {auction.lots.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ApproveForm auction={auction} busy={busy} onBusyChange={setBusy} />
        <RejectForm id={auction.id} busy={busy} onBusyChange={setBusy} />
      </div>
    </div>
  );
}

/** One lot: title, OB/KB, and its photos (US-032 AC1). */
function LotCard({ lot }: { lot: AuctionLot }) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-2 text-sm">
      <p className="font-medium">{lot.title ?? 'Lot tanpa judul'}</p>
      <p className="text-muted-foreground">
        OB {formatRupiah(lot.ob)} · KB {formatRupiah(lot.kb)}
      </p>
      {lot.photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {lot.photos.map((url) => (
            /* eslint-disable-next-line @next/next/no-img-element -- backend's own file origin, same as FarmQueue's farm photos */
            <img
              key={url}
              src={url}
              alt={lot.title ?? 'Foto lot'}
              className="h-24 w-32 rounded-md border border-border object-cover"
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Tidak ada foto.</p>
      )}
    </div>
  );
}

/* Both fee inputs stay plain strings in the form (an empty string means "no
   override", matching the backend's optional `listing_fee`/`join_fee`), and
   are parsed to whole non-negative rupiah on submit — `z.coerce.number()`
   would otherwise widen the resolver's input type to `unknown` and break
   `useForm`'s generic. */
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

/** Approve, with an optional override of this one auction's fees (US-032 AC2/AC3). */
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

  async function submit(data: ApproveData) {
    const overriding = data.listing_fee !== '' || data.join_fee !== '';
    const message = overriding
      ? 'Setujui lelang ini dengan biaya yang diubah dan tagih biaya listing?'
      : 'Setujui lelang ini dan tagih biaya listing sesuai tabel biaya?';

    onBusyChange(true);
    if (!confirm(message)) {
      onBusyChange(false);
      return;
    }

    const result = overriding
      ? await approveAuctionWithOverride(auction.id, {
          ...(data.listing_fee !== '' ? { listing_fee: Number(data.listing_fee) } : {}),
          ...(data.join_fee !== '' ? { join_fee: Number(data.join_fee) } : {}),
          reason: data.reason
        })
      : await approveAuction(auction.id);
    onBusyChange(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Lelang disetujui.');
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2 rounded-md border border-border p-3" noValidate>
      <h3 className="text-sm font-medium">Setujui</h3>
      <p className="text-xs text-muted-foreground">
        Kosongkan kedua biaya untuk menyetujui sesuai tabel biaya. Isi salah satu untuk mengubah
        biaya khusus lelang ini — alasan wajib diisi.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField
          label={`Biaya listing baru (asal: ${formatRupiah(auction.listing_fee)})`}
          type="number"
          min={0}
          step={1}
          placeholder="Biarkan kosong"
          {...register('listing_fee')}
        />
        <FormField
          label={`Biaya join baru (asal: ${formatRupiah(auction.join_fee)})`}
          type="number"
          min={0}
          step={1}
          placeholder="Biarkan kosong"
          {...register('join_fee')}
        />
      </div>
      <FormField
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
    </form>
  );
}

/* A rejection must carry the reason the farmer reads (US-032 AC4). */
const rejectSchema = z.object({
  reason: z.string().trim().min(1, 'Masukkan alasan penolakan')
});

type RejectData = z.infer<typeof rejectSchema>;

/** Reject, with the reason the farmer will see on their draft (US-032 AC4).
    Clearing any override is the backend's job (AC5) — this form makes no
    claim about it either way. */
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

  async function submit(data: RejectData) {
    onBusyChange(true);
    if (!confirm('Tolak lelang ini? Lelang kembali ke draft dan petani harus mengirim ulang.')) {
      onBusyChange(false);
      return;
    }

    const result = await rejectAuction(id, data.reason);
    onBusyChange(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Lelang ditolak.');
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2 rounded-md border border-border p-3" noValidate>
      <h3 className="text-sm font-medium">Tolak</h3>
      <FormField
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
    </form>
  );
}
