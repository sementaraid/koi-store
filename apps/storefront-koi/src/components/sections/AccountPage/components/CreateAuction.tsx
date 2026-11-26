'use client';

import { AlertTriangle, ImagePlus, Trash2, Truck } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Label, RenderIf, Textarea } from '@koi/ui';
import { NativeSelect } from '@koi/ui/primitives/native-select';
import { FileField } from '@/components/molecules';
import { createAuction, uploadLotPhoto, type FeeCategory } from '@/lib/data/auctions';
import { feeCategoryLabel } from '@/lib/helpers/fee-category-label';
import {
  AUCTION_MAX_DAYS,
  AUCTION_MIN_DAYS,
  auctionLengthError,
  auctionSchema,
  EMPTY_LOT,
  jakartaIso,
  KOI_AGES,
  KOI_SEXES,
  KOI_VARIETIES,
  lotPhotosError,
  MAX_LOTS_PER_AUCTION,
  totalListingFee,
  type AuctionFormData
} from '@/lib/helpers/auction-schema';
import { formatPrice } from '@/lib/helpers/format-price';
import { ROUTES } from '@/const/routes';
import type { AccountIdentity } from './AccountFrame';

import { AccountFrame } from './AccountFrame';

type LotPhotos = { urls: string[]; files: File[]; uploading: boolean };

export type CreateAuctionProps = {
  categories: FeeCategory[] | null;
  openOrders: number;
  identity?: AccountIdentity;
};

export function CreateAuction({ categories, openOrders, identity }: CreateAuctionProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<LotPhotos[]>([
    { urls: [], files: [], uploading: false }
  ]);
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

  async function onPhotosChosen(index: number, list: File[]) {
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
        i === index
          ? { urls: [...p.urls, ...uploaded], files: [...p.files, ...list], uploading: false }
          : p
      )
    );
  }

  function removePhoto(index: number, photoIndex: number) {
    setPhotos((current) =>
      current.map((p, i) =>
        i === index
          ? {
              ...p,
              urls: p.urls.filter((_, j) => j !== photoIndex),
              files: p.files.filter((_, j) => j !== photoIndex)
            }
          : p
      )
    );
  }

  function addLot() {
    if (fields.length >= MAX_LOTS_PER_AUCTION) return;
    append(EMPTY_LOT);
    setPhotos((current) => [...current, { urls: [], files: [], uploading: false }]);
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
        kb: lot.kb,
        variety: lot.variety,
        size_cm: Number(lot.size_cm),
        age: lot.age || undefined,
        sex: lot.sex || undefined,
        has_certificate: lot.has_certificate === 'yes',
        certificate_issuer:
          lot.has_certificate === 'yes' ? lot.certificate_issuer || undefined : undefined,
        pond_origin: lot.pond_origin || undefined,
        breeder_notes: lot.breeder_notes || undefined,
        video_url: lot.video_url || undefined
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
      openOrders={openOrders}
      identity={identity}
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
                  <NativeSelect id="fee-category" variant="filled" {...register('fee_category_id')}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {feeCategoryLabel(c.name)}
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
                  <NativeSelect id="delivery-method" variant="filled" {...register('delivery_method')}>
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
                    <Textarea
                      id={`lot-${index}-description`}
                      rows={3}
                      {...register(`lots.${index}.description`)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`lot-${index}-variety`}>Varietas</Label>
                      <NativeSelect
                        id={`lot-${index}-variety`}
                        variant="filled"
                        {...register(`lots.${index}.variety`)}
                      >
                        <option value="">Pilih varietas</option>
                        {KOI_VARIETIES.map((variety) => (
                          <option key={variety} value={variety}>
                            {variety}
                          </option>
                        ))}
                      </NativeSelect>
                      <RenderIf when={errors.lots?.[index]?.variety?.message}>
                        {(message) => <p className="text-xs text-destructive-ink">{message}</p>}
                      </RenderIf>
                    </div>
                    <FormField
                      label="Ukuran (cm)"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={150}
                      placeholder="Contoh: 55"
                      error={errors.lots?.[index]?.size_cm?.message}
                      {...register(`lots.${index}.size_cm`)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`lot-${index}-age`}>Umur</Label>
                      <NativeSelect id={`lot-${index}-age`} variant="filled" {...register(`lots.${index}.age`)}>
                        <option value="">Tidak diisi</option>
                        {KOI_AGES.map((age) => (
                          <option key={age} value={age}>
                            {age}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`lot-${index}-sex`}>Jenis kelamin</Label>
                      <NativeSelect id={`lot-${index}-sex`} variant="filled" {...register(`lots.${index}.sex`)}>
                        <option value="">Tidak diisi</option>
                        {KOI_SEXES.map((sex) => (
                          <option key={sex} value={sex}>
                            {sex}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor={`lot-${index}-certificate`}>Sertifikat</Label>
                    <NativeSelect
                      id={`lot-${index}-certificate`}
                      variant="filled"
                      {...register(`lots.${index}.has_certificate`)}
                    >
                      <option value="no">Tidak ada (koi lokal)</option>
                      <option value="yes">Ya, ada sertifikat</option>
                    </NativeSelect>
                  </div>

                  <RenderIf when={watch(`lots.${index}.has_certificate`) === 'yes'}>
                    {() => (
                      <FormField
                        label="Penerbit sertifikat (opsional)"
                        placeholder="Contoh: Nogyosai"
                        error={errors.lots?.[index]?.certificate_issuer?.message}
                        {...register(`lots.${index}.certificate_issuer`)}
                      />
                    )}
                  </RenderIf>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Asal kolam (opsional)"
                      placeholder="Kota, provinsi"
                      error={errors.lots?.[index]?.pond_origin?.message}
                      {...register(`lots.${index}.pond_origin`)}
                    />
                    <FormField
                      label="Tautan video YouTube (opsional)"
                      type="url"
                      placeholder="https://youtu.be/…"
                      hint="Tautan tonton, youtu.be, atau Shorts."
                      error={errors.lots?.[index]?.video_url?.message}
                      {...register(`lots.${index}.video_url`)}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor={`lot-${index}-notes`}>Catatan breeder (opsional)</Label>
                    <Textarea
                      id={`lot-${index}-notes`}
                      rows={3}
                      {...register(`lots.${index}.breeder_notes`)}
                    />
                    <RenderIf when={errors.lots?.[index]?.breeder_notes?.message}>
                      {(message) => <p className="text-xs text-destructive-ink">{message}</p>}
                    </RenderIf>
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
                    <FileField
                      id={`lot-${index}-photos`}
                      label="Foto lot"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={photos[index]?.uploading}
                      hint="Foto pertama jadi gambar utama lot."
                      files={photos[index]?.files ?? []}
                      onChoose={(files) => onPhotosChosen(index, files)}
                      onRemove={(photoIndex) => removePhoto(index, photoIndex)}
                      fileStatus="Terunggah"
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
