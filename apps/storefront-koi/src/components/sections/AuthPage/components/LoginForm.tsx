'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, FormField, RenderIf } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { login, transferCart } from '@/lib/data/customer';
import { authErrorMessage } from '@/lib/helpers/auth-error';
import { safeRedirect } from '@/lib/helpers/safe-redirect';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AuthFrame } from './AuthFrame';
import { loginSchema, type LoginData } from './schema';

const NOTICES: Record<string, string> = {
  sessionExpired: 'Sesi Anda telah berakhir. Masuk lagi untuk melanjutkan.',
  sessionRequired: 'Masuk dulu untuk melanjutkan.',
  sessionError:
    'Kami tidak bisa memeriksa sesi Anda karena gangguan sementara. Coba masuk lagi.'
};

export function LoginForm({
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
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const notice = Object.keys(NOTICES).find(
    (key) => params.get(key) === 'true'
  );

  async function submit(data: LoginData) {
    const form = new FormData();
    form.append('email', data.email);
    form.append('password', data.password);

    const result = await login(form);

    if (!result.success) {
      toast.error(
        authErrorMessage(
          result.message,
          'Email atau kata sandi salah. Periksa kembali dan coba lagi.'
        )
      );
      return;
    }

    await transferCart().catch(() => undefined);

    router.push(safeRedirect(params.get('redirect'), ROUTES.home));
    router.refresh();
  }

  return (
    <AuthFrame
      eyebrow="Masuk"
      title="Selamat datang kembali"
      lede="Masuk untuk menawar, menyimpan koi favorit, dan melihat tagihan Anda."
      account={account}
      cart={cart}
      aside={
        <>
          Belum punya akun?{' '}
          <Link
            href={ROUTES.signup}
            className="font-medium text-accent-ink hover:underline"
          >
            Daftar sekarang
          </Link>
        </>
      }
    >
      <RenderIf when={notice && NOTICES[notice]}>
        {(message) => (
          <p
            role="status"
            className="rounded-md bg-muted px-3 py-2 text-xs text-foreground"
          >
            {message}
          </p>
        )}
      </RenderIf>

      <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Link
          href={ROUTES.forgotPassword}
          className="justify-self-end text-xs text-muted-foreground hover:text-accent-ink hover:underline"
        >
          Lupa kata sandi?
        </Link>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>
    </AuthFrame>
  );
}
