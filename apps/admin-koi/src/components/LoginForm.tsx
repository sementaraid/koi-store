'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ROUTES } from '@/const/routes';
import { login } from '@/lib/data/auth';
import { safeRedirect } from '@/lib/helpers/safe-redirect';

/* The sign-in shape. Loose on purpose: the back office checks credentials
   against the server, and a password rule enforced here would only lock out an
   operator whose password predates it. The storefront's `schema.ts` makes the
   same call for the same reason. */
const schema = z.object({
  email: z.string().trim().min(1, 'Masukkan email Anda').pipe(z.email('Format email tidak valid')),
  password: z.string().min(1, 'Masukkan kata sandi Anda')
});

type LoginData = z.infer<typeof schema>;

/** Why they were sent here, when they did not come on their own. */
const NOTICES: Record<string, string> = {
  sessionExpired: 'Sesi Anda telah berakhir. Masuk lagi untuk melanjutkan.',
  sessionRequired: 'Masuk dulu untuk melanjutkan.'
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const notice = Object.keys(NOTICES).find((key) => params.get(key) === 'true');

  async function submit(data: LoginData) {
    const form = new FormData();
    form.append('email', data.email);
    form.append('password', data.password);

    const result = await login(form);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    /* Only a path of this app's own: an absolute URL in `?redirect=` is a
       phishing link wearing the back office's domain, handed to someone who
       just typed an admin password. */
    router.push(safeRedirect(params.get('redirect'), ROUTES.home));
    /* The chrome is a server component holding the signed-out face. */
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <p className="text-2xs font-bold tracking-widest text-muted-foreground uppercase">
              Admin
            </p>
            <CardTitle className="text-xl tracking-tight">Koi Store Back Office</CardTitle>
            <CardDescription>
              Masuk dengan akun admin untuk menyetujui kebun, top-up, dan lelang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notice && NOTICES[notice] ? (
              <p role="status" className="rounded-md bg-muted px-3 py-2 text-xs text-foreground">
                {NOTICES[notice]}
              </p>
            ) : null}

            <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
              <FormField
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="admin@koi.dev"
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
              <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
                {isSubmitting ? 'Memproses…' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Area internal. Akun pelanggan dan kebun tidak bisa masuk di sini.
        </p>
      </div>
    </main>
  );
}
