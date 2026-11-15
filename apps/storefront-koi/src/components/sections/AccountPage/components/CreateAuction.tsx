'use client';

import { AlertTriangle, Gavel, ImagePlus, Trash2, Truck } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Label, RenderIf } from '@koi/ui';
import { NativeSelect } from '@koi/ui/primitives/native-select';
import { createAuction, uploadLotPhoto, type FeeCategory } from '@/lib/data/auctions';
import {
  AUCTION_MAX_DAYS,
  AUCTION_MIN_DAYS,
  auctionLengthError,
  auctionSchema,
  jakartaIso,
  lotPhotosError,
  MAX_LOTS_PER_AUCTION,
  totalListingFee,
  type AuctionFormData
} from '@/lib/helpers/auction-schema';
import { formatPrice } from '@/lib/helpers/format-price';
import { ROUTES } from '@/const/routes';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';

/** One lot's photos, held outside react-hook-form: a photo is a URL only
    after it finishes uploading, and the field array needs that settled value,
    not the `File` the input started from (same split as farm registration's
    KTP and farm photos). */
type LotPhotos = { urls: string[]; uploading: boolean };

const EMPTY_LOT = { title: '', description: '', ob: 0, kb: 0 };

/** Props for {@link CreateAuction}. */
export type CreateAuctionProps = {
  /** The fee table, or `null` when it could not be read. */
  categories: FeeCategory[] | null;
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/** Create a draft auction with its lots (US-030 AC1, AC2, AC8).
 *
 * @remarks
 * Every limit this form checks — lot count, auction length, OB/KB being
 * whole rupiah, one photo per lot — mirrors a check the server itself makes
 * (T-030.4); this form only says so before the submit returns the same 400.
 * Fees are never typed here (AC4): the category's listing and join fee are
 * shown read-only, and the server snapshots them onto the auction. */
export function CreateAuction({ categories, openOrders, account, cart }: CreateAuctionProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<LotPhotos[]>([{ urls: [], uploading: false }]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      fee_category_id: categories?.[0]?.id ?? '',
      start_at: '',
      end_at: '',
      delivery_method: 'courier',
      lots: [EMPTY_LOT]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lots' });

  const feeCategoryId = watch('fee_category_id');
  const category = categories?.find((c) => c.id === feeCategoryId);

  async function onPhotosChosen(index: number, files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;

    setPhotoError(null);
    setPhotos((current) =>
      current.map((p, i) => (i === index ? { ...p, uploading: true } : p))
    );

    const uploaded: string[] = [];
    for (const file of list) {
      const result = await uploadLotPhoto(file);
      if (!result.success) {
        setPhotoError(result.error);
        setPhotos((current) =>
          current.map((p, i) => (i === index ? { ...p, uploading: false } : p))
        );
        return;
      }
      uploaded.push(result.data);
    }

    setPhotos((current) =>
      current.map((p, i) =>
        i === index ? { urls: [...p.urls, ...uploaded], uploading: false } : p
      )
    );
  }

  function addLot() {
    if (fields.length >= MAX_LOTS_PER_AUCTION) return;
    append(EMPTY_LOT);
    setPhotos((current) => [...current, { urls: [], uploading: false }]);
  }

  function removeLot(index: number) {
    remove(index);
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  async function submit(data: AuctionFormData) {
    const lengthError = auctionLengthError(data.start_at, data.end_at);
    if (lengthError) {
      setError('end_at', { message: lengthError });
      return;
    }

    for (let i = 0; i < data.lots.length; i++) {
      const err = lotPhotosError(photos[i]?.urls.length ?? 0);
      if (err) {
        setPhotoError(`Lot ${i + 1}: ${err}`);
        return;
      }
    }

    const result = await createAuction({
      fee_category_id: data.fee_category_id,
      start_at: jakartaIso(data.start_at),
      end_at: jakartaIso(data.end_at),
      delivery_method: data.delivery_method,
      lots: data.lots.map((lot, i) => ({
        title: lot.title,
        description: lot.description?.trim() ? lot.description.trim() : undefined,
        photos: photos[i]?.urls ?? [],
        ob: lot.ob,
        kb: lot.kb
      }))
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Lelang dibuat sebagai draf.');
    router.push(ROUTES.farmHome);
    router.refresh();
  }

  return (
    <AccountFrame
      title="Buat lelang"
      eyebrow={
        <>
          <Gavel aria-hidden className="size-3.5" />
          Kebun
        </>
      }
      description="Lelang tersimpan sebagai draf dan masih bisa diubah sebelum diajukan."
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      <RenderIf when={!categories}>
        {() => (
          <Card className="border-destructive-ink/30 px-5 py-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Kategori biaya belum bisa ditampilkan
              </CardTitle>
              <CardDescription>
                Muat ulang halaman untuk mencoba lagi. Lelang tidak dapat dibuat tanpa kategori.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={categories}>
        {(cats) => (
          <form
            onSubmit={handleSubmit(submit)}
            className="grid gap-6"
            noValidate
          >
            <Card className="px-5 py-4">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base">Kategori dan jadwal</CardTitle>
                <CardDescription>
                  Satu kategori untuk seluruh lot di lelang ini. Panjang lelang{' '}
                  {AUCTION_MIN_DAYS}-{AUCTION_MAX_DAYS} hari.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-0 pb-0">
                <div className="grid gap-1.5">
                  <Label htmlFor="fee-category">Kategori biaya</Label>
                  <NativeSelect id="fee-category" {...register('fee_category_id')}>
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

                <RenderIf when={category}>
                  {(c) => (
                    <div className="grid gap-1 rounded-md bg-muted px-3 py-2 text-sm sm:grid-cols-3">
                      <p>
                        <span className="text-muted-foreground">Biaya pasang/lot: </span>
                        <span className="font-medium text-foreground">
                          {formatPrice(c.listing_fee)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Biaya ikut: </span>
                        <span className="font-medium text-foreground">
                          {formatPrice(c.join_fee)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Total biaya pasang: </span>
                        <span className="font-medium text-foreground">
                          {formatPrice(totalListingFee(c.listing_fee, fields.length))}
                        </span>
                      </p>
                    </div>
                  )}
                </RenderIf>
                <p className="text-xs text-muted-foreground">
                  Biaya ditetapkan dari tabel biaya dan tidak dapat diubah di sini.
                </p>

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
                  <Label htmlFor="delivery-method">Metode pengiriman</Label>
                  <NativeSelect id="delivery-method" {...register('delivery_method')}>
                    <option value="courier">Kurir</option>
                    <option value="self_delivery">Antar sendiri</option>
                  </NativeSelect>
                </div>
              </CardContent>
            </Card>

            {fields.map((field, index) => (
              <Card key={field.id} className="px-5 py-4">
                <CardHeader className="flex-row items-center justify-between px-0 pt-0">
                  <CardTitle className="text-base">Lot {index + 1}</CardTitle>
                  <RenderIf when={fields.length > 1}>
                    {() => (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeLot(index)}
                      >
                        <Trash2 aria-hidden />
                        Hapus
                      </Button>
                    )}
                  </RenderIf>
                </CardHeader>
                <CardContent className="grid gap-4 px-0 pb-0">
                  <FormField
                    label="Judul lot"
                    placeholder="Contoh: Kohaku 55"
                    error={errors.lots?.[index]?.title?.message}
                    {...register(`lots.${index}.title`)}
                  />

                  <div className="grid gap-1.5">
                    <Label htmlFor={`lot-${index}-description`}>Deskripsi (opsional)</Label>
                    <textarea
                      id={`lot-${index}-description`}
                      rows={3}
                      className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 md:text-sm dark:bg-input/30"
                      {...register(`lots.${index}.description`)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="OB — harga awal (Rp)"
                      inputMode="numeric"
                      error={errors.lots?.[index]?.ob?.message}
                      {...register(`lots.${index}.ob`, { valueAsNumber: true })}
                    />
                    <FormField
                      label="KB — kenaikan tawar (Rp)"
                      inputMode="numeric"
                      error={errors.lots?.[index]?.kb?.message}
                      {...register(`lots.${index}.kb`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <FormField
                      label="Foto lot"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={photos[index]?.uploading}
                      hint="Foto pertama jadi gambar utama lot."
                      onChange={(e) => onPhotosChosen(index, e.target.files)}
                    />
                    <RenderIf when={photos[index]?.urls.length ? true : undefined}>
                      {() => (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ImagePlus aria-hidden className="size-3.5" />
                          {photos[index]?.urls.length} foto terunggah
                        </p>
                      )}
                    </RenderIf>
                    <RenderIf when={photos[index]?.uploading}>
                      {() => <p className="text-xs text-muted-foreground">Mengunggah foto…</p>}
                    </RenderIf>
                  </div>
                </CardContent>
              </Card>
            ))}

            <RenderIf when={photoError}>
              {(message) => <p className="text-sm text-destructive-ink">{message}</p>}
            </RenderIf>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={fields.length >= MAX_LOTS_PER_AUCTION}
                onClick={addLot}
              >
                Tambah lot
              </Button>
              <p className="text-xs text-muted-foreground">
                {fields.length}/{MAX_LOTS_PER_AUCTION} lot
              </p>
            </div>

            <RenderIf when={errors.lots?.message}>
              {(message) => <p className="text-sm text-destructive-ink">{message}</p>}
            </RenderIf>

            <div>
              <Button type="submit" disabled={isSubmitting}>
                <Truck aria-hidden />
                {isSubmitting ? 'Membuat lelang…' : 'Buat sebagai draf'}
              </Button>
            </div>
          </form>
        )}
      </RenderIf>
    </AccountFrame>
  );
}
