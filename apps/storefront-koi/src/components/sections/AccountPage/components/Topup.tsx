'use client';

import { AlertTriangle, Banknote, CheckCircle2, Clock, Landmark, Upload, XCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, RenderIf } from '@koi/ui';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { createTopupRequest } from '@/lib/data/topups';
import type { PlatformBankAccount, TopupRequestsPage } from '@/lib/data/topups';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import {
  MAX_SCREENSHOT_BYTES,
  parseTopupAmount,
  screenshotError
} from '@/lib/helpers/topup-request';
import { stripValidationPrefix } from '@/lib/helpers/validation-message';
import type { AccountIdentity } from './AccountFrame';

import { AccountFrame } from './AccountFrame';
import { topupSchema, type TopupFormData } from './schema';

export type TopupProps = {
  requests: TopupRequestsPage;
  bankAccount: PlatformBankAccount | null;
  failed: boolean;
  openOrders: number;
  identity?: AccountIdentity;
};

const STATUS_LABEL: Record<TopupRequestsPage['requests'][number]['status'], string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak'
};

export function Topup({ requests, bankAccount, failed, openOrders, identity }: TopupProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: { amount: '' }
  });

  const screenshotFile = watch('screenshot')?.[0];

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submit(data: TopupFormData) {
    const parsed = parseTopupAmount(data.amount);
    if (!parsed.ok) {
      setError('amount', { message: parsed.error });
      return;
    }

    const file = data.screenshot[0];
    const fileError = screenshotError(file);
    if (fileError) {
      setError('screenshot', { message: fileError });
      return;
    }

    const result = await createTopupRequest(parsed.amount, file);

    if (!result.success) {
      toast.error(stripValidationPrefix(result.error));
      return;
    }

    toast.success('Permintaan top-up terkirim. Menunggu admin memeriksa transfer Anda.');
    reset({ amount: '' });
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  return (
    <AccountFrame
      title="Top-up"
      eyebrow={
        <>
          <Banknote aria-hidden className="size-3.5" />
          Dompet
        </>
      }
      description="Transfer ke rekening platform, unggah bukti, dan tunggu admin memeriksa mutasi bank. Saldo tidak langsung berubah."
      openOrders={openOrders}
      identity={identity}
    >
      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark aria-hidden className="size-4" />
            Rekening tujuan transfer
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1.5 px-0 pb-0 text-sm">
          <RenderIf when={bankAccount}>
            {(acc) => (
              <>
                <p>
                  <span className="text-muted-foreground">Bank: </span>
                  <span className="font-medium text-foreground">{acc.bank_name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">No. rekening: </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {acc.bank_account_number}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Atas nama: </span>
                  <span className="font-medium text-foreground">{acc.bank_account_holder}</span>
                </p>
              </>
            )}
          </RenderIf>
          <RenderIf when={!bankAccount}>
            {() => (
              <p className="text-muted-foreground">
                Rekening tujuan belum bisa ditampilkan. Muat ulang halaman untuk mencoba lagi.
              </p>
            )}
          </RenderIf>
        </CardContent>
      </Card>

      <Card className="px-5 py-4">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base">Kirim bukti transfer</CardTitle>
          <CardDescription>
            Jumlah berapa pun diterima. Saldo baru bertambah setelah admin menyetujui — proses ini
            tidak instan.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <form onSubmit={handleSubmit(submit)} className="grid gap-5" noValidate>
            <FormField
              label="Jumlah transfer (Rp)"
              inputMode="numeric"
              placeholder="500000"
              error={errors.amount?.message}
              {...register('amount')}
            />

            <div className="grid gap-1.5">
              <FormField
                label="Bukti transfer"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                error={errors.screenshot?.message}
                hint={`JPG, PNG, atau WEBP. Maksimal ${MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.`}
                {...register('screenshot', { onChange: (e) => onFileChange(e.target.files) })}
              />
              <RenderIf when={preview}>
                {(src) => (
                  // eslint-disable-next-line @next/next/no-img-element -- a
                  <img
                    src={src}
                    alt="Pratinjau bukti transfer"
                    className="mt-1 max-h-48 w-fit rounded-md border border-border object-contain"
                  />
                )}
              </RenderIf>
            </div>

            <div>
              <Button type="submit" disabled={isSubmitting || !screenshotFile}>
                <Upload aria-hidden />
                {isSubmitting ? 'Mengirim…' : 'Kirim permintaan top-up'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <RenderIf when={failed}>
        {() => (
          <Card className="border-destructive-ink/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                Gagal memuat riwayat top-up
              </CardTitle>
              <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!failed && requests.requests.length ? requests.requests : null}>
        {(list) => (
          <Card className="px-5 py-1">
            {list.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">
                    {formatPrice(request.amount)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatDeadline(request.created_at)}
                  </p>
                  <RenderIf when={request.status === 'rejected' ? request.reason : undefined}>
                    {(reason) => (
                      <p className="mt-1 text-sm text-destructive-ink">Alasan: {reason}</p>
                    )}
                  </RenderIf>
                </div>

                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'info'
                      : request.status === 'rejected'
                        ? 'muted'
                        : 'neutral'
                  }
                >
                  {request.status === 'approved' && <CheckCircle2 aria-hidden />}
                  {request.status === 'rejected' && <XCircle aria-hidden />}
                  {request.status === 'pending' && <Clock aria-hidden />}
                  {STATUS_LABEL[request.status]}
                </Badge>
              </div>
            ))}
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!failed && !requests.requests.length}>
        {() => (
          <EmptyFeed
            icon={<Banknote aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada permintaan top-up"
            noMatchBody="Permintaan yang Anda kirim muncul di sini, lengkap dengan statusnya."
          />
        )}
      </RenderIf>
    </AccountFrame>
  );
}
