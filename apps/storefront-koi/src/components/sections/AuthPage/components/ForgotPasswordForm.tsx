'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Link } from '@/components/atoms';
import { FormField } from '@/components/cells/FormField/FormField';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { ROUTES } from '@/const/routes';
import { sendResetPasswordEmail } from '@/lib/data/customer';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AuthFrame } from './AuthFrame';
import { forgotPasswordSchema, type ForgotPasswordData } from './schema';

/** Shown whatever `sendResetPasswordEmail` actually finds — see the remarks. */
const NEUTRAL_MESSAGE =
  'Jika email ini terdaftar, kami telah mengirim tautan atur ulang kata sandi. Periksa kotak masuk dan folder spam Anda.';

/**
 * Ask for a reset link.
 *
 * @remarks
 * The confirmation is the same sentence whether the email exists or not: a
 * form that says "we found no account for that email" is a visitor-by-visitor
 * way to find out which emails have accounts here, which is why the server
 * action itself answers `{ success: true }` either way.
 */
export function ForgotPasswordForm({
  account,
  cart
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  async function submit(data: ForgotPasswordData) {
    await sendResetPasswordEmail(data.email);
    setSent(true);
  }

  return (
    <AuthFrame
      eyebrow="Lupa Sandi"
      title="Atur ulang kata sandi"
      lede="Masukkan email akun Anda, kami kirimkan tautan untuk membuat kata sandi baru."
      account={account}
      cart={cart}
      aside={
        <Link
          href={ROUTES.login}
          className="font-medium text-accent-ink hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      }
    >
      <RenderIf when={sent}>
        {() => (
          <p role="status" className="text-sm text-foreground">
            {NEUTRAL_MESSAGE}
          </p>
        )}
      </RenderIf>

      <RenderIf when={!sent}>
        {() => (
          <form
            onSubmit={handleSubmit(submit)}
            className="grid gap-4"
            noValidate
          >
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Mengirim…' : 'Kirim tautan atur ulang'}
            </Button>
          </form>
        )}
      </RenderIf>
    </AuthFrame>
  );
}
