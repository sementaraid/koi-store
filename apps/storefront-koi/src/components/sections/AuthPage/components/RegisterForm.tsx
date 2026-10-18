'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Link } from '@/components/atoms';
import { FormField } from '@/components/cells/FormField/FormField';
import { ROUTES } from '@/const/routes';
import { signup } from '@/lib/data/customer';
import { authErrorMessage } from '@/lib/helpers/auth-error';
import { safeRedirect } from '@/lib/helpers/safe-redirect';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AuthFrame } from './AuthFrame';
import { PASSWORD_RULES, registerSchema, type RegisterData } from './schema';

/**
 * Sign up.
 *
 * @remarks
 * `signup()` returns the created customer on success and an error *string* on
 * failure — its `catch` ends in `error.toString()` — so the branch is on the
 * shape of what came back, not on a status. It also calls `transferCart()`
 * itself, which is why this form, unlike sign-in, does not.
 *
 * The password rules are stated under the field rather than checked live: one
 * list, read off the same schema that enforces them, cannot drift from what
 * the form will actually accept.
 */
export function RegisterForm({
  account,
  cart
}: {
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    }
  });

  async function submit(data: RegisterData) {
    const form = new FormData();
    form.append('email', data.email);
    form.append('password', data.password);
    form.append('first_name', data.firstName);
    form.append('last_name', data.lastName);
    form.append('phone', data.phone);

    const result = await signup(form);

    /* A customer object means it worked; anything else is the action's own
       stringified error. */
    if (!result || typeof result === 'string' || !('id' in result)) {
      toast.error(
        authErrorMessage(result, 'Pendaftaran gagal. Coba lagi sebentar lagi.')
      );
      return;
    }

    toast.success('Akun Anda sudah aktif. Selamat datang di Indokoi.');
    router.push(safeRedirect(params.get('redirect'), ROUTES.home));
    router.refresh();
  }

  return (
    <AuthFrame
      eyebrow="Daftar"
      title="Buat akun Indokoi"
      lede="Satu akun untuk menawar di lelang, membeli koi, dan melacak pengiriman."
      account={account}
      cart={cart}
      aside={
        <>
          Sudah punya akun?{' '}
          <Link
            href={ROUTES.login}
            className="font-medium text-accent-ink hover:underline"
          >
            Masuk di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nama depan"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <FormField
            label="Nama belakang"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <FormField
          label="Nomor telepon"
          type="tel"
          autoComplete="tel"
          placeholder="08xxxxxxxxxx"
          hint="Dipakai untuk konfirmasi menang lelang dan pengiriman."
          error={errors.phone?.message}
          {...register('phone')}
        />

        <FormField
          label="Kata sandi"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          hint={
            <ul className="list-disc space-y-0.5 ps-4">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          }
          {...register('password')}
        />

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Memproses…' : 'Daftar'}
        </Button>
      </form>
    </AuthFrame>
  );
}
