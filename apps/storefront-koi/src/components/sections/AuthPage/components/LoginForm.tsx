'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, Link } from '@/components/atoms';
import { FormField } from '@/components/cells/FormField/FormField';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { ROUTES } from '@/const/routes';
import { login, transferCart } from '@/lib/data/customer';
import { authErrorMessage } from '@/lib/helpers/auth-error';
import { safeRedirect } from '@/lib/helpers/safe-redirect';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AuthFrame } from './AuthFrame';
import { loginSchema, type LoginData } from './schema';

/** Why the visitor was sent here, when they did not come on their own. */
const NOTICES: Record<string, string> = {
  sessionExpired: 'Sesi Anda telah berakhir. Masuk lagi untuk melanjutkan.',
  sessionRequired: 'Masuk dulu untuk melanjutkan.'
};

/**
 * Sign in.
 *
 * @remarks
 * `login()` does not move the guest's cart onto the account — `signup()` does,
 * but sign-in is the commoner path, and a visitor who filled a cart and then
 * remembered they have an account would watch it empty. So the transfer is done
 * here, after the token lands and before the redirect.
 *
 * The redirect honours `?redirect=`, but only a path of this site's own: an
 * absolute URL in that query is an open redirect, which is a phishing link
 * wearing the house's domain.
 */
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

    /* Best effort: the sign-in itself succeeded, and a cart that failed to
       follow is not worth sending the visitor back to the form over. */
    await transferCart().catch(() => undefined);

    router.push(safeRedirect(params.get('redirect'), ROUTES.home));
    /* The header is a server component holding the signed-out face; without
       this it keeps showing `Masuk` until something else revalidates. */
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
