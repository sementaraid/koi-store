'use client';

import type { HttpTypes } from '@medusajs/types';
import { Check, Lock, Mail, Settings as SettingsIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge, Button, FormField } from "@koi/ui";
import { Eyebrow } from '@/components/atoms/Eyebrow/Eyebrow';
import { Separator } from '@koi/ui/primitives/separator';
import { sendResetPasswordEmail, updateCustomer } from '@/lib/data/customer';

import { AccountFrame } from './AccountFrame';
import { profileSchema, type ProfileData } from './schema';

export type SettingsProps = {
  customer: HttpTypes.StoreCustomer;
  openOrders: number;
};

export function Settings({ customer, openOrders }: SettingsProps) {
  const [sendingReset, setSendingReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: customer.first_name ?? '',
      lastName: customer.last_name ?? '',
      phone: customer.phone ?? ''
    }
  });

  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email;

  async function saveProfile(data: ProfileData) {
    try {
      await updateCustomer({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone
      });
      toast.success('Data akun diperbarui.');
    } catch {
      toast.error('Gagal menyimpan data akun.');
    }
  }

  async function requestReset() {
    setSendingReset(true);
    await sendResetPasswordEmail(customer.email);
    setSendingReset(false);
    toast.success(`Tautan ganti sandi dikirim ke ${customer.email}.`);
  }

  return (
    <AccountFrame
      title="Pengaturan"
      eyebrow={
        <>
          <SettingsIcon
            aria-hidden
            className="size-3.5"
          />
          Akun
        </>
      }
      description="Nama yang tampil di pesanan Anda dan sandi untuk masuk."
      identity={{ name, email: customer.email }}
      openOrders={openOrders}
    >
      <section aria-labelledby="akun-profil">
        <Eyebrow>Data akun</Eyebrow>
        <h2
          id="akun-profil"
          className="mt-2 font-heading text-xl font-extrabold text-foreground sm:text-2xl"
        >
          Profil Anda
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Dipakai untuk pesanan, pengiriman, dan konfirmasi lelang.
        </p>

        <form
          onSubmit={handleSubmit(saveProfile)}
          className="mt-6 grid gap-5"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Nama depan"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <FormField
              label="Nama belakang"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <FormField
            label="Telepon"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <div className="grid gap-1.5">
            <span className="flex items-center gap-2 text-sm font-medium">Email</span>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm break-all text-foreground">{customer.email}</span>
              <Badge variant="info">
                <Lock aria-hidden />
                Identitas akun
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Email tidak bisa diubah di sini.
            </p>
          </div>

          <div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !isDirty}
            >
              <Check aria-hidden />
              {isSubmitting ? 'Menyimpan…' : 'Simpan perubahan'}
            </Button>
          </div>
        </form>
      </section>

      <Separator />

      <section aria-labelledby="akun-sandi">
        <Eyebrow>Sandi</Eyebrow>
        <h2
          id="akun-sandi"
          className="mt-2 font-heading text-xl font-extrabold text-foreground sm:text-2xl"
        >
          Ganti sandi
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Kami kirim tautan ke{' '}
          <span className="font-semibold text-foreground">{customer.email}</span>. Buka
          tautan itu untuk memasang sandi baru.
        </p>

        <Button
          variant="outline"
          size="lg"
          className="mt-6"
          disabled={sendingReset}
          onClick={requestReset}
        >
          <Mail aria-hidden />
          {sendingReset ? 'Mengirim…' : 'Kirim tautan ganti sandi'}
        </Button>
      </section>
    </AccountFrame>
  );
}
