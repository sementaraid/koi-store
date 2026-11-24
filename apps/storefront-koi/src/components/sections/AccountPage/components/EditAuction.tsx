'use client';

import { AlertTriangle, Gavel, ImagePlus, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Label,
  RenderIf
} from '@koi/ui';
import { NativeSelect } from '@koi/ui/primitives/native-select';
import {
  addAuctionLots,
  removeAuctionLot,
  updateDraftAuction,
  uploadLotPhoto,
  type AuctionDetail,
  type FeeCategory
} from '@/lib/data/auctions';
import { auctionStatusLabel } from '@/lib/helpers/auction-status';
import { canCancelAuction } from '@/lib/helpers/auction-cancel';
import {
  auctionFieldsSchema,
  auctionLengthError,
  canRemoveLot,
  jakartaInputValue,
  jakartaIso,
  lotPhotosError,
  lotSchema,
  MAX_LOTS_PER_AUCTION,
  totalListingFee,
  type AuctionFieldsData,
  type LotFormData
} from '@/lib/helpers/auction-schema';
import { formatPrice } from '@/lib/helpers/format-price';
import { ROUTES } from '@/const/routes';
import type { AccountIdentity } from './AccountFrame';

import { AccountFrame } from './AccountFrame';
import { CancelAuctionButton } from './CancelAuctionButton';
import { LiveLinkForm } from './LiveLinkForm';
import { SubmitAuctionButton } from './SubmitAuctionButton';

export type EditAuctionProps = {
  auction: AuctionDetail;
  categories: FeeCategory[] | null;
  openOrders: number;
  identity?: AccountIdentity;
};

export function EditAuction({ auction: initial, categories, openOrders, identity }: EditAuctionProps) {
  const router = useRouter();
  const [auction, setAuction] = useState(initial);
  const editable = auction.status === 'draft';
  const status = auctionStatusLabel(auction.status);
  const rejection = auction.rejection_reason?.trim();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<AuctionFieldsData>({
    resolver: zodResolver(auctionFieldsSchema),
    defaultValues: {
      fee_category_id: auction.fee_category_id,
      start_at: jakartaInputValue(auction.start_at),
      end_at: jakartaInputValue(auction.end_at),
      delivery_method: auction.delivery_method
    }
  });

  async function persist(data: AuctionFieldsData): Promise<boolean> {
    const lengthError = auctionLengthError(data.start_at, data.end_at);
    if (lengthError) {
      setError('end_at', { message: lengthError });
      return false;
    }

    const result = await updateDraftAuction(auction.id, {
      fee_category_id: data.fee_category_id,
      start_at: jakartaIso(data.start_at),
      end_at: jakartaIso(data.end_at),
      delivery_method: data.delivery_method
    });

    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success('Perubahan lelang tersimpan.');
    return true;
  }

  async function saveOnly(data: AuctionFieldsData) {
    if (!(await persist(data))) return;
    router.push(ROUTES.farmHome);
    router.refresh();
  }

  const prepareSubmit = () =>
    new Promise<boolean>((resolve) => {
      void handleSubmit(
        async (data) => resolve(await persist(data)),
        () => resolve(false)
      )();
    });

  const {
    register: registerLot,
    handleSubmit: handleLotSubmit,
    reset: resetLot,
    formState: { errors: lotErrors, isSubmitting: addingLot }
  } = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: { title: '', description: '', ob: 0, kb: 0 }
  });
  const [lotPhotos, setLotPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function onLotPhotos(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;

    setPhotoError(null);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of list) {
      const result = await uploadLotPhoto(file);
      if (!result.success) {
        setPhotoError(result.error);
        setUploading(false);
        return;
      }
      uploaded.push(result.data);
    }
    setLotPhotos((current) => [...current, ...uploaded]);
    setUploading(false);
  }

  async function addLot(data: LotFormData) {
    const err = lotPhotosError(lotPhotos.length);
    if (err) {
      setPhotoError(err);
      return;
    }

    const result = await addAuctionLots(auction.id, [
      {
        title: data.title,
        description: data.description?.trim() ? data.description.trim() : undefined,
        photos: lotPhotos,
        ob: data.ob,
        kb: data.kb
      }
    ]);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setAuction(result.data);
    setLotPhotos([]);
    setPhotoError(null);
    resetLot({ title: '', description: '', ob: 0, kb: 0 });
    toast.success('Lot ditambahkan.');
    router.refresh();
  }

  async function removeLot(lotId: string) {
    setRemovingId(lotId);
    const result = await removeAuctionLot(auction.id, lotId);
    setRemovingId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setAuction(result.data);
    toast.success('Lot dihapus.');
    router.refresh();
  }

  return (
    <AccountFrame
      title="Ubah lelang"
      eyebrow={
        <>
          <Gavel aria-hidden className="size-3.5" />
          Kebun
        </>
      }
      description="Hanya draf yang bisa diubah. Setelah dikirim, lelang menunggu persetujuan admin."
      action={
        canCancelAuction(auction.status) ? (
          <CancelAuctionButton
            auctionId={auction.id}
            onSuccess={(next) => setAuction((cur) => ({ ...next, lots: cur.lots }))}
          />
        ) : undefined
      }
      openOrders={openOrders}
      identity={identity}
    >
      <RenderIf when={editable ? rejection : null}>
        {(reason) => (
          <Card className="border-destructive-ink/30 px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Lelang dikembalikan admin
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-foreground">{reason}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <p className="text-xs text-muted-foreground">
                Perbaiki lelang sesuai catatan di atas, lalu kirim ulang untuk persetujuan.
              </p>
            </CardContent>
          </Card>
        )}
      </RenderIf>

      <LiveLinkForm
        auction={auction}
        onSaved={(next) => setAuction((cur) => ({ ...cur, live_stream_url: next.live_stream_url }))}
      />

      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">{auction.lots.length} lot</CardTitle>
          <CardDescription className="mt-1">{status.label}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 px-0 pb-0 text-sm">
          <p>
            <span className="text-muted-foreground">Biaya pasang: </span>
            <span className="font-medium text-foreground">
              {formatPrice(auction.listing_fee)}
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">Biaya ikut: </span>
            <span className="font-medium text-foreground">{formatPrice(auction.join_fee)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Biaya tidak dapat diubah di sini dan tidak berubah saat lot ditambah atau dihapus.
            Biaya dihitung ulang dari tabel biaya setiap kali lelang diajukan.
          </p>
          <RenderIf when={categories}>
            {(cats) => {
              const category = cats.find((c) => c.id === auction.fee_category_id);
              return category ? (
                <p className="text-xs text-muted-foreground">
                  Biaya pasang saat diajukan: {formatPrice(category.listing_fee)} ×{' '}
                  {auction.lots.length} lot = {formatPrice(totalListingFee(category.listing_fee, auction.lots.length))}
                </p>
              ) : null;
            }}
          </RenderIf>
        </CardContent>
      </Card>

      <Card className="px-5 py-1">
        {auction.lots.map((lot) => (
          <div
            key={lot.id}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-b-0"
          >
            <div className="min-w-0">
              <p className="font-bold text-foreground">{lot.title ?? 'Lot tanpa judul'}</p>
              <p className="text-muted-foreground">
                OB {formatPrice(lot.ob)} · KB {formatPrice(lot.kb)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">{lot.photos.length} foto</p>
              <RenderIf when={editable}>
                {() => (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canRemoveLot(auction.lots.length) || removingId === lot.id}
                    onClick={() => removeLot(lot.id)}
                  >
                    <Trash2 aria-hidden />
                    {removingId === lot.id ? 'Menghapus…' : 'Hapus'}
                  </Button>
                )}
              </RenderIf>
            </div>
          </div>
        ))}
        <RenderIf when={editable && !canRemoveLot(auction.lots.length)}>
          {() => (
            <p className="border-t border-border py-2 text-xs text-muted-foreground">
              Lelang harus punya minimal satu lot, jadi lot terakhir tidak bisa dihapus.
            </p>
          )}
        </RenderIf>
      </Card>

      <RenderIf when={editable ? auction : null}>
        {() => (
          <Card className="px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base">Tambah lot</CardTitle>
              <CardDescription>
                Maksimal {MAX_LOTS_PER_AUCTION} lot per lelang ({auction.lots.length}/
                {MAX_LOTS_PER_AUCTION} sekarang).
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <RenderIf when={auction.lots.length < MAX_LOTS_PER_AUCTION}>
                {() => (
                  <form
                    onSubmit={handleLotSubmit(addLot)}
                    className="grid gap-4"
                    noValidate
                  >
                    <FormField
                      label="Judul lot"
                      placeholder="Contoh: Kohaku 55"
                      error={lotErrors.title?.message}
                      {...registerLot('title')}
                    />

                    <div className="grid gap-1.5">
                      <Label htmlFor="add-lot-description">Deskripsi (opsional)</Label>
                      <textarea
                        id="add-lot-description"
                        rows={3}
                        className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 md:text-sm dark:bg-input/30"
                        {...registerLot('description')}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        label="OB — harga awal (Rp)"
                        inputMode="numeric"
                        error={lotErrors.ob?.message}
                        {...registerLot('ob', { valueAsNumber: true })}
                      />
                      <FormField
                        label="KB — kenaikan tawar (Rp)"
                        inputMode="numeric"
                        error={lotErrors.kb?.message}
                        {...registerLot('kb', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <FormField
                        label="Foto lot"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={uploading}
                        hint="Foto pertama jadi gambar utama lot."
                        onChange={(e) => onLotPhotos(e.target.files)}
                      />
                      <RenderIf when={lotPhotos.length ? true : undefined}>
                        {() => (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ImagePlus aria-hidden className="size-3.5" />
                            {lotPhotos.length} foto terunggah
                          </p>
                        )}
                      </RenderIf>
                      <RenderIf when={uploading}>
                        {() => <p className="text-xs text-muted-foreground">Mengunggah foto…</p>}
                      </RenderIf>
                      <RenderIf when={photoError}>
                        {(message) => <p className="text-xs text-destructive-ink">{message}</p>}
                      </RenderIf>
                    </div>

                    <div>
                      <Button type="submit" variant="outline" disabled={addingLot || uploading}>
                        {addingLot ? 'Menambah…' : 'Tambah lot'}
                      </Button>
                    </div>
                  </form>
                )}
              </RenderIf>
            </CardContent>
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!editable}>
        {() => (
          <Card className="border-destructive-ink/30 px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Tidak bisa diubah
              </CardTitle>
              <CardDescription>
                Lelang ini sudah tidak berstatus draf. Hubungi admin bila ada yang perlu diperbaiki.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={editable ? categories : null}>
        {(cats) => (
          <form
            onSubmit={handleSubmit(saveOnly)}
            className="grid gap-4"
            noValidate
          >
            <div className="grid gap-1.5">
              <Label htmlFor="edit-fee-category">Kategori biaya</Label>
              <NativeSelect id="edit-fee-category" {...register('fee_category_id')}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
              <RenderIf when={errors.fee_category_id?.message}>
                {(message) => <p className="text-xs text-destructive-ink">{message}</p>}
              </RenderIf>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Mulai"
                type="datetime-local"
                error={errors.start_at?.message}
                {...register('start_at')}
              />
              <FormField
                label="Selesai"
                type="datetime-local"
                error={errors.end_at?.message}
                {...register('end_at')}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-delivery-method">Metode pengiriman</Label>
              <NativeSelect id="edit-delivery-method" {...register('delivery_method')}>
                <option value="courier">Kurir</option>
                <option value="self_delivery">Antar sendiri</option>
              </NativeSelect>
            </div>

            <p className="text-xs text-muted-foreground">
              Biaya lelang tidak berubah saat draf diubah; biaya dihitung ulang saat lelang
              diajukan.
            </p>

            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan…' : 'Simpan perubahan'}
              </Button>
            </div>
          </form>
        )}
      </RenderIf>

      <RenderIf when={editable && !categories}>
        {() => (
          <Card className="border-destructive-ink/30 px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Kategori biaya belum bisa ditampilkan
              </CardTitle>
              <CardDescription>
                Muat ulang halaman untuk mencoba lagi, atau kirim lelang dengan data yang sudah
                tersimpan.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={editable ? auction : null}>
        {() => (
          <Card className="px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base">Ajukan untuk persetujuan</CardTitle>
              <CardDescription>
                Biaya pasang dihitung ulang dari tabel biaya saat dikirim, dan saldo Anda
                diperiksa. Lelang yang dikirim tidak bisa diubah sampai admin memutuskan.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <SubmitAuctionButton
                auctionId={auction.id}
                prepare={categories ? prepareSubmit : undefined}
                onSuccess={setAuction}
              />
            </CardContent>
          </Card>
        )}
      </RenderIf>
    </AccountFrame>
  );
}
