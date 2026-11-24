'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button, FormField } from '@koi/ui';
import { Link } from '@/components/atoms';
import { ROUTES } from '@/const/routes';
import { updateCustomerPassword } from '@/lib/data/customer';
import { authErrorMessage } from '@/lib/helpers/auth-error';

import { AuthFrame } from './AuthFrame';
import { PASSWORD_RULES, newPasswordSchema, type NewPasswordData } from './schema';

export function NewPasswordForm({ token }: { token?: string }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  async function submit(data: NewPasswordData) {
    if (!token) return;

    const result = await updateCustomerPassword(data.password, token);

    if (!result.success) {
      toast.error(
        authErrorMessage(
          result.error,
          'Tautan atur ulang tidak berlaku lagi. Minta tautan baru.'
        )
      );
      return;
    }

    toast.success('Kata sandi baru tersimpan. Silakan masuk.');
    router.push(ROUTES.login);
    router.refresh();
  }

  if (!token) {
    return (
      <AuthFrame
        eyebrow="Atur Sandi"
        title="Tautan tidak lengkap"
        lede="Tautan atur ulang ini tidak membawa token. Minta tautan baru untuk melanjutkan."
        aside={
          <Link
            href={ROUTES.forgotPassword}
            className="font-medium text-accent-ink hover:underline"
          >
            Minta tautan atur ulang
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">
          Tautan dari email berlaku 15 menit. Jika sudah lewat, minta yang baru.
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Atur Sandi"
      title="Buat kata sandi baru"
      lede="Pilih kata sandi yang belum pernah Anda pakai di tempat lain."
    >
      <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
        <FormField
          label="Kata sandi baru"
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
        <FormField
          label="Ulangi kata sandi baru"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Menyimpan…' : 'Simpan kata sandi'}
        </Button>
      </form>
    </AuthFrame>
  );
}
