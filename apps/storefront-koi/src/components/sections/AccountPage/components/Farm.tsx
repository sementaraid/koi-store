'use client';

import type { HttpTypes } from '@medusajs/types';
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  ImagePlus,
  Sprout,
  Upload,
  XCircle
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Badge,
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
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { registerFarm, type FarmSeller, type FarmStep, type FarmUploads } from '@/lib/data/farm';
import {
  farmFileError,
  farmPhotosError,
  MAX_FARM_FILE_BYTES,
  MAX_FARM_PHOTOS,
  nikError
} from '@/lib/helpers/farm-registration';
import { farmRegistrationSchema, type FarmRegistrationData } from '@/lib/helpers/farm-schema';
import { farmStatusInfo } from '@/lib/helpers/farm-status';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';

export type FarmProps = {
  customer: HttpTypes.StoreCustomer;
  seller: FarmSeller | null;
  failed: boolean;
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

const STEP_COPY: Record<FarmStep, string> = {
  session: 'Sesi akun',
  signin: 'Masuk sebagai petani',
  upload: 'Unggah berkas',
  register: 'Kirim pendaftaran',
  member: 'Aktifkan sesi petani'
};

const MB = MAX_FARM_FILE_BYTES / (1024 * 1024);

export function Farm({ customer, seller, failed, openOrders, account, cart }: FarmProps) {
  const frame = (body: ReactNode) => (
    <AccountFrame
      title="Kebun"
      eyebrow={
        <>
          <Sprout aria-hidden className="size-3.5" />
          Area petani
        </>
      }
      description="Daftarkan kebun Anda untuk bisa membuat lelang koi. Persetujuan dilakukan admin."
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      {body}
    </AccountFrame>
  );

  if (failed) {
    return frame(
      <Card className="border-destructive-ink/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
            Gagal memuat status kebun
          </CardTitle>
          <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  if (seller) {
    return frame(<Status seller={seller} />);
  }

  return frame(<RegistrationForm customer={customer} />);
}

function Status({ seller }: { seller: FarmSeller }) {
  const info = farmStatusInfo(seller);
  const reason = seller.status_reason?.trim();

  return (
    <Card className="px-5 py-4">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">{seller.name}</CardTitle>
          <Badge variant={info.tone}>
            {info.label === 'Disetujui' && <BadgeCheck aria-hidden />}
            {info.label === 'Menunggu' && <Clock aria-hidden />}
            {(info.label === 'Ditolak' || info.label === 'Ditangguhkan') && (
              <XCircle aria-hidden />
            )}
            {info.label}
          </Badge>
        </div>
        <CardDescription className="mt-2 text-sm text-foreground">{info.title}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 px-0 pb-0 text-sm">
        <p className="leading-relaxed text-muted-foreground">{info.body}</p>

        <RenderIf when={info.reasonLabel ? reason : undefined}>
          {(why) => (
            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs font-bold text-foreground">{info.reasonLabel}</p>
              <p className="mt-1 text-sm text-foreground">{why}</p>
            </div>
          )}
        </RenderIf>

        <RenderIf when={seller.approved_at}>
          {(at) => (
            <p className="text-xs text-muted-foreground">
              Disetujui {formatDeadline(at)} WIB
            </p>
          )}
        </RenderIf>

        <RenderIf when={info.approved}>
          {() => (
            <div>
              <Button
                render={<Link href={ROUTES.farmHome} />}
                nativeButton={false}
              >
                <Sprout aria-hidden />
                Buka area petani
              </Button>
            </div>
          )}
        </RenderIf>
      </CardContent>
    </Card>
  );
}

function RegistrationForm({ customer }: { customer: HttpTypes.StoreCustomer }) {
  const router = useRouter();
  const [ktp, setKtp] = useState<File | null>(null);
  const [farmPhotos, setFarmPhotos] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<FarmUploads>({});
  const [failedStep, setFailedStep] = useState<{ step: FarmStep; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FarmRegistrationData>({
    resolver: zodResolver(farmRegistrationSchema),
    defaultValues: {
      name: '',
      description: '',
      address1: '',
      city: '',
      province: '',
      holderName: '',
      bankName: '',
      accountNumber: '',
      nik: '',
      password: ''
    }
  });

  const phone = customer.phone?.trim();

  function chooseKtp(file: File | undefined, input: HTMLInputElement) {
    setFileError(null);
    if (!file) {
      setKtp(null);
      return;
    }
    const error = farmFileError(file);
    if (error) {
      setFileError(`Foto KTP: ${error}`);
      setKtp(null);
      input.value = '';
      return;
    }
    setKtp(file);
    setUploads((current) => ({ ...current, ktp_photo_key: undefined }));
  }

  function choosePhotos(files: FileList | null, input: HTMLInputElement) {
    setFileError(null);
    const list = Array.from(files ?? []);
    if (!list.length) {
      setFarmPhotos([]);
      return;
    }

    const error = farmPhotosError(list.length);
    if (error) {
      setFileError(`Foto kebun: ${error}`);
      setFarmPhotos([]);
      input.value = '';
      return;
    }

    for (const file of list) {
      const each = farmFileError(file);
      if (each) {
        setFileError(`Foto kebun: ${each}`);
        setFarmPhotos([]);
        input.value = '';
        return;
      }
    }

    setFarmPhotos(list);
    setUploads((current) => ({ ...current, farm_photo_urls: [] }));
  }

  async function submit(data: FarmRegistrationData) {
    setFailedStep(null);

    const nik = nikError(data.nik);
    if (nik) {
      toast.error(nik);
      return;
    }
    if (!ktp) {
      setFileError('Unggah foto KTP Anda.');
      return;
    }
    const photoError = farmPhotosError(farmPhotos.length);
    if (photoError) {
      setFileError(photoError);
      return;
    }

    const result = await registerFarm(data, ktp, farmPhotos, uploads);

    if (!result.ok) {
      setUploads(result.uploads);
      if (result.step === 'session') {
        router.push(
          `${ROUTES.login}?sessionExpired=true&redirect=${encodeURIComponent(ROUTES.farm)}`
        );
        return;
      }
      setFailedStep({ step: result.step, message: result.message });
      toast.error(`Gagal di langkah "${STEP_COPY[result.step]}".`);
      return;
    }

    toast.success('Pendaftaran kebun terkirim. Menunggu persetujuan admin.');
    router.push(ROUTES.farm);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid gap-6"
      noValidate
    >
      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Data kebun</CardTitle>
          <CardDescription>Nama dan lokasi yang dilihat pembeli dan admin.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-0 pb-0">
          <FormField
            label="Nama kebun"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="farm-description">Deskripsi kebun (opsional)</Label>
            <textarea
              id="farm-description"
              rows={4}
              placeholder="Jenis koi, pengalaman, dan hal lain yang perlu pembeli tahu…"
              className="w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 md:text-sm dark:bg-input/30"
              {...register('description')}
            />
            <RenderIf when={errors.description?.message}>
              {(message) => (
                <p role="alert" className="text-xs text-destructive-ink">
                  {message}
                </p>
              )}
            </RenderIf>
          </div>

          <FormField
            label="Alamat kebun"
            placeholder="Jalan, nomor, desa/kelurahan…"
            error={errors.address1?.message}
            {...register('address1')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Kota"
              error={errors.city?.message}
              {...register('city')}
            />
            <FormField
              label="Provinsi"
              error={errors.province?.message}
              {...register('province')}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="farm-phone">Nomor WhatsApp</Label>
            <input
              id="farm-phone"
              type="tel"
              readOnly
              value={phone ?? ''}
              aria-readonly
              aria-describedby="farm-phone-hint"
              className="h-9 w-full min-w-0 rounded-md border border-input bg-muted px-2.5 py-1 text-base text-muted-foreground md:text-sm"
            />
            <div id="farm-phone-hint" className="text-xs text-muted-foreground">
              {phone ? (
                <>
                  Nomor WhatsApp kebun memakai nomor telepon akun Anda dan tidak dapat diubah di
                  sini (D-016).
                </>
              ) : (
                <>
                  Akun Anda belum punya nomor telepon. Tambahkan dulu di{' '}
                  <Link
                    href={ROUTES.settings}
                    className="font-medium text-accent-ink hover:underline"
                  >
                    Pengaturan akun
                  </Link>
                  , karena nomor ini dipakai sebagai WhatsApp kebun.
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Rekening bank</CardTitle>
          <CardDescription>
            Rekening milik petani sendiri. Pemenang lelang mentransfer langsung ke rekening ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-0 pb-0">
          <FormField
            label="Nama pemilik rekening"
            hint="Harus nama Anda sendiri, sama seperti di KTP."
            error={errors.holderName?.message}
            {...register('holderName')}
          />
          <FormField
            label="Nama bank"
            placeholder="Contoh: BCA, BRI, Mandiri"
            error={errors.bankName?.message}
            {...register('bankName')}
          />
          <FormField
            label="Nomor rekening"
            inputMode="numeric"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />
        </CardContent>
      </Card>

      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Identitas dan foto kebun</CardTitle>
          <CardDescription>
            KTP disimpan privat dan hanya dilihat admin. Foto kebun tampil di halaman lelang.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-0 pb-0">
          <FormField
            label="NIK KTP (16 angka)"
            inputMode="numeric"
            maxLength={16}
            error={errors.nik?.message}
            {...register('nik')}
          />

          <FormField
            label="Foto KTP"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hint={`JPG, PNG, atau WEBP. Maksimal ${MB} MB. Hanya admin yang dapat melihatnya.`}
            onChange={(event) => chooseKtp(event.target.files?.[0], event.target)}
          />

          <FormField
            label={`Foto kebun (1–${MAX_FARM_PHOTOS})`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hint={`Pilih minimal satu, maksimal ${MAX_FARM_PHOTOS}. Tiap file maksimal ${MB} MB.`}
            onChange={(event) => choosePhotos(event.target.files, event.target)}
          />

          <RenderIf when={ktp || farmPhotos.length ? true : undefined}>
            {() => (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImagePlus aria-hidden className="size-3.5" />
                {ktp ? '1 foto KTP' : 'Belum ada foto KTP'} · {farmPhotos.length} foto kebun
              </p>
            )}
          </RenderIf>

          <RenderIf when={fileError}>
            {(message) => (
              <p
                role="alert"
                className="text-xs text-destructive-ink"
              >
                {message}
              </p>
            )}
          </RenderIf>
        </CardContent>
      </Card>

      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Konfirmasi akun</CardTitle>
          <CardDescription>
            Pendaftaran memakai login yang sama. Masukkan kata sandi akun Anda sekali lagi — kata
            sandi tidak disimpan di browser, dan sesi petani (D-003) perlu dibuka dengan login yang
            sama.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-0 pb-0">
          <FormField
            label="Kata sandi akun"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </CardContent>
      </Card>

      <RenderIf when={failedStep}>
        {(failure) => (
          <div
            role="alert"
            className="rounded-md border border-destructive-ink/30 bg-destructive/5 px-3 py-2 text-sm"
          >
            <p className="font-bold text-destructive-ink">
              Gagal di langkah: {STEP_COPY[failure.step]}
            </p>
            <p className="mt-1 text-foreground">{failure.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Berkas yang sudah terunggah tidak perlu diunggah ulang; kirim formulir ini lagi.
            </p>
          </div>
        )}
      </RenderIf>

      <div className="grid gap-2">
        <div>
          <Button
            type="submit"
            disabled={isSubmitting || !phone}
          >
            <Upload aria-hidden />
            {isSubmitting ? 'Mengirim pendaftaran…' : 'Kirim pendaftaran kebun'}
          </Button>
        </div>
        <RenderIf when={!phone}>
          {() => (
            <p className="text-xs text-muted-foreground">
              Tambahkan nomor telepon di Pengaturan akun dulu — WhatsApp kebun memakainya.
            </p>
          )}
        </RenderIf>
      </div>
    </form>
  );
}
