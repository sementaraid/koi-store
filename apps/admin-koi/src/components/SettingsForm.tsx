'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField
} from '@koi/ui';
import { updateSettings, type Settings } from '@/lib/data/settings';

const schema = z
  .object({
    extend_window_minutes: z.number().int('Harus bilangan bulat').positive('Harus lebih dari 0'),
    max_lots_per_auction: z.number().int('Harus bilangan bulat').positive('Harus lebih dari 0'),
    auction_min_days: z.number().int('Harus bilangan bulat').positive('Harus lebih dari 0'),
    auction_max_days: z.number().int('Harus bilangan bulat').positive('Harus lebih dari 0'),
    claim_window_hours: z.number().int('Harus bilangan bulat').positive('Harus lebih dari 0'),
    bank_name: z.string().trim().min(1, 'Wajib diisi'),
    bank_account_number: z.string().trim().min(1, 'Wajib diisi'),
    bank_account_holder: z.string().trim().min(1, 'Wajib diisi')
  })
  .refine((data) => data.auction_min_days <= data.auction_max_days, {
    message: 'Minimum tidak boleh lebih dari maksimum',
    path: ['auction_min_days']
  });

type SettingsData = z.infer<typeof schema>;

export type SettingsFormProps = {
  settings: Settings;
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<SettingsData>({
    resolver: zodResolver(schema),
    values: settings
  });

  async function submit(data: SettingsData) {
    const result = await updateSettings(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Pengaturan disimpan.');
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid gap-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Batas lelang</CardTitle>
          <CardDescription>Berlaku untuk lelang yang dibuat setelah disimpan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Jendela perpanjangan (menit)"
            type="number"
            min={1}
            step={1}
            error={errors.extend_window_minutes?.message}
            {...register('extend_window_minutes', { valueAsNumber: true })}
          />
          <FormField
            label="Maksimum lot per lelang"
            type="number"
            min={1}
            step={1}
            error={errors.max_lots_per_auction?.message}
            {...register('max_lots_per_auction', { valueAsNumber: true })}
          />
          <FormField
            label="Durasi lelang minimum (hari)"
            type="number"
            min={1}
            step={1}
            error={errors.auction_min_days?.message}
            {...register('auction_min_days', { valueAsNumber: true })}
          />
          <FormField
            label="Durasi lelang maksimum (hari)"
            type="number"
            min={1}
            step={1}
            error={errors.auction_max_days?.message}
            {...register('auction_max_days', { valueAsNumber: true })}
          />
          <FormField
            label="Jendela klaim DOA (jam)"
            type="number"
            min={1}
            step={1}
            error={errors.claim_window_hours?.message}
            {...register('claim_window_hours', { valueAsNumber: true })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rekening bank platform</CardTitle>
          <CardDescription>
            Ditunjukkan ke pelanggan di halaman top-up (D-009).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Nama bank"
            error={errors.bank_name?.message}
            {...register('bank_name')}
          />
          <FormField
            label="Nomor rekening"
            inputMode="numeric"
            error={errors.bank_account_number?.message}
            {...register('bank_account_number')}
          />
          <FormField
            label="Atas nama"
            className="sm:col-span-2"
            error={errors.bank_account_holder?.message}
            {...register('bank_account_holder')}
          />
        </CardContent>
      </Card>

      <div>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? 'Menyimpan…' : 'Simpan pengaturan'}
        </Button>
      </div>
    </form>
  );
}
