'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  ImageUp,
  Info,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RenderIf
} from '@koi/ui';
import { CopyValue, EmptyFeed } from '@/components/cells';
import { ROUTES } from '@/const/routes';
import { createTopupRequest } from '@/lib/data/topups';
import type {
  PlatformBankAccount,
  TopupRequestsPage,
  TopupRequestStatus
} from '@/lib/data/topups';
import type { WalletPage } from '@/lib/data/wallet';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice, formatPriceCompact, formatRupiahNumber } from '@/lib/helpers/format-price';
import {
  MAX_SCREENSHOT_BYTES,
  formatFileSize,
  parseTopupAmount,
  screenshotError,
  topupDisabledReason
} from '@/lib/helpers/topup-request';
import { stripValidationPrefix } from '@/lib/helpers/validation-message';
import { mergeWalletHistory, type WalletHistoryEntry } from '@/lib/helpers/wallet-history';
import type { AccountIdentity } from './AccountFrame';

import { AccountFrame } from './AccountFrame';
import { topupSchema, type TopupFormData } from './schema';

export type TopupProps = {
  /** `null` when the wallet could not be read; the balance card says so. */
  wallet: WalletPage | null;
  /** `null` when the top-up requests could not be read. */
  requests: TopupRequestsPage | null;
  bankAccount: PlatformBankAccount | null;
  openOrders: number;
  identity?: AccountIdentity;
  /** Whole rupiah from `?amount` (the join-fee shortfall link). */
  initialAmount?: number;
  /** Lot title from `?judul`, so the prefill hint can name the lot (AC2). */
  initialTitle?: string;
};

export function Topup({
  wallet,
  requests,
  bankAccount,
  openOrders,
  identity,
  initialAmount,
  initialTitle
}: TopupProps) {
  const balance = wallet?.balance ?? null;
  const failed = !wallet || !requests;
  const history = mergeWalletHistory(
    wallet?.transactions ?? [],
    requests?.requests ?? [],
    bankAccount?.bank_name ?? null
  );
  const router = useRouter();
  // Fixed ids: the page has one amount field, and `useId` ids replay
  // differently on the server and the client under Next's bundled React.
  const amountId = 'topup-amount';
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: { amount: initialAmount ? String(initialAmount) : '' }
  });

  const amountText = watch('amount');
  const screenshot = watch('screenshot');
  const file = screenshot?.[0];
  const parsed = parseTopupAmount(amountText);

  // The three defaults are empty strings until an admin sets them (D-009,
  // D-010), so a configured account means all three values are non-empty.
  const bankConfigured =
    !!bankAccount &&
    [bankAccount.bank_name, bankAccount.bank_account_number, bankAccount.bank_account_holder].every(
      value => value.trim().length > 0
    );

  const disabledReason = topupDisabledReason({
    amountValid: parsed.ok,
    bankConfigured,
    hasFile: !!file
  });

  const chipValues = Array.from(
    new Set([...(initialAmount ? [initialAmount] : []), 1_000_000, 5_000_000, 10_000_000])
  );
  const amountIsOther = amountText !== '' && !chipValues.includes(Number(amountText));

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;

    const message = screenshotError(candidate);
    if (message) {
      setError('screenshot', { message });
      return;
    }

    clearErrors('screenshot');
    setSubmitted(false);

    // RHF wants a FileList; the file picker and the drop area both produce one
    // this way, so the form validates the same screenshot the preview shows.
    const transfer = new DataTransfer();
    transfer.items.add(candidate);
    setValue('screenshot', transfer.files, { shouldValidate: true });
  }

  function removeFile() {
    // `screenshot` is set through `setValue`, never registered, so `resetField`
    // does nothing here. Store an empty FileList instead: that clears the value
    // the submit reads, the preview and the input's own selection.
    setValue('screenshot', new DataTransfer().files, { shouldValidate: false });
    clearErrors('screenshot');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function chooseAmount(amount: number) {
    setSubmitted(false);
    setValue('amount', String(amount), { shouldValidate: true, shouldDirty: true });
  }

  function resend(amount: number) {
    chooseAmount(amount);
    // A rejected proof has to be replaced, not sent again as-is.
    removeFile();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => amountRef.current?.focus(), 0);
  }

  async function submit(data: TopupFormData) {
    const parsedAmount = parseTopupAmount(data.amount);
    if (!parsedAmount.ok) {
      setError('amount', { message: parsedAmount.error });
      return;
    }

    const chosen = data.screenshot?.[0];
    if (!chosen) {
      setError('screenshot', { message: 'Unggah bukti transfer' });
      return;
    }

    const fileError = screenshotError(chosen);
    if (fileError) {
      setError('screenshot', { message: fileError });
      return;
    }

    const result = await createTopupRequest(parsedAmount.amount, chosen);

    if (!result.success) {
      toast.error(stripValidationPrefix(result.error));
      return;
    }

    reset({ amount: '' });
    removeFile();
    setSubmitted(true);
    toast.success('Permintaan top-up terkirim.');
    router.refresh();
  }

  return (
    <AccountFrame
      title="Saldo & top-up"
      mobileTitle="Top-up saldo"
      backHref={ROUTES.account}
      openOrders={openOrders}
      identity={identity}
    >
      <Card className="border-accent bg-accent px-5 py-4">
        <p className="text-sm text-muted-foreground">Saldo tersedia</p>
        <p className="mt-1 font-heading text-2xl font-bold text-foreground tabular-nums">
          {balance === null ? 'Belum bisa dimuat' : formatPrice(balance)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Saldo dipakai untuk biaya ikut lelang dan biaya listing farm.
        </p>
      </Card>

      <RenderIf when={submitted}>
        {() => (
          <Card role="status" className="border-success/40 px-5 py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-bold text-foreground">Permintaan top-up terkirim.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Menunggu dicek admin, biasanya kurang dari 60 menit. Saldo bertambah setelah
                  admin mencocokkan transfer Anda.
                </p>
              </div>
            </div>
          </Card>
        )}
      </RenderIf>

      <form
        ref={formRef}
        onSubmit={handleSubmit(submit)}
        className="grid scroll-mt-24 gap-6 lg:grid-cols-2 lg:items-start"
        noValidate
      >
        {/* On phones the steps are three cards in numeric order. On desktop the
            first and third share one card (the board's left column), so the
            wrapper is `contents` on phones and the card itself from lg up. */}
        <div className="contents lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:rounded-card lg:border lg:border-card-edge lg:bg-card lg:shadow-card">
          <Card className="order-1 px-5 py-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-6 lg:pt-6 lg:pb-0 lg:shadow-none">
            <StepHeading step={1}>Pilih nominal</StepHeading>

          <div role="group" aria-label="Nominal cepat" className="mt-4 grid grid-cols-4 gap-2">
            {chipValues.map(value => {
              const selected = Number(amountText) === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseAmount(value)}
                  className={cn(
                    'h-11 rounded-control border px-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    selected
                      ? 'border-accent-ink bg-accent text-accent-ink ring-1 ring-accent-ink'
                      : 'border-outline-edge bg-background text-foreground shadow-xs hover:bg-secondary'
                  )}
                >
                  {chipLabel(value)}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={amountIsOther}
              onClick={() => {
                setSubmitted(false);
                setValue('amount', '', { shouldValidate: false, shouldDirty: true });
                amountRef.current?.focus();
              }}
              className={cn(
                'h-11 rounded-control border px-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                amountIsOther
                  ? 'border-accent-ink bg-accent text-accent-ink ring-1 ring-accent-ink'
                  : 'border-outline-edge bg-background text-foreground shadow-xs hover:bg-secondary'
              )}
            >
              Lainnya
            </button>
          </div>

          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => {
              const number = Number(field.value);
              const display =
                field.value && Number.isSafeInteger(number)
                  ? formatRupiahNumber(number)
                  : field.value;
              const showHint = initialAmount !== undefined && number === initialAmount;
              const describedBy =
                cn(
                  showHint && `${amountId}-hint`,
                  fieldState.error && `${amountId}-error`
                ).trim() || undefined;

              return (
                <div className="mt-4 grid gap-1.5">
                  <Label htmlFor={amountId} className="font-semibold">
                    Nominal top-up (Rp){' '}
                    <span aria-hidden className="text-signal">
                      *
                    </span>
                  </Label>
                  <div
                    className={cn(
                      'flex h-12 items-center gap-2 rounded-field bg-muted px-2',
                      fieldState.error
                        ? 'ring-1 ring-destructive'
                        : 'focus-within:ring-2 focus-within:ring-accent-ink/40'
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-9 shrink-0 items-center rounded-control bg-background px-2.5 shadow-xs before:text-sm before:font-semibold before:text-muted-foreground before:content-['Rp']"
                    />
                    <input
                      id={amountId}
                      ref={element => {
                        field.ref(element);
                        amountRef.current = element;
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      value={display}
                      onChange={event => {
                        setSubmitted(false);
                        // Digits only, and no leading zero: the value the field
                        // shows is the value the server accepts.
                        field.onChange(
                          event.target.value.replace(/\D/g, '').replace(/^0+/, '')
                        );
                      }}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.error ? true : undefined}
                      aria-describedby={describedBy}
                      className="h-full w-full min-w-0 bg-transparent text-base text-foreground tabular-nums outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  {showHint ? (
                    <p id={`${amountId}-hint`} className="text-sm text-muted-foreground">
                      Diisi dari kekurangan biaya ikut {initialTitle ?? 'lelang'}. Bisa diubah.
                    </p>
                  ) : null}
                  {fieldState.error ? (
                    <p id={`${amountId}-error`} role="alert" className="text-sm text-destructive-ink">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              );
            }}
          />
          </Card>

          <div
            aria-hidden
            className="order-2 my-5 hidden h-px bg-divider lg:mx-6 lg:block"
          />

          <Card className="order-3 px-5 py-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-6 lg:pt-0 lg:pb-6 lg:shadow-none">
            <StepHeading step={3}>Unggah bukti transfer</StepHeading>

          <div className="mt-4 grid gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Pilih bukti transfer"
              onChange={event => {
                acceptFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />

            {file ? (
              <div className="flex items-center gap-3 rounded-control border border-border p-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a catalog image
                  <img
                    src={preview}
                    alt="Pratinjau bukti transfer"
                    className="size-14 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded bg-muted">
                    <ImageUp aria-hidden className="size-6 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Terunggah · {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Ganti
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Hapus bukti transfer"
                    onClick={removeFile}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={event => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={event => {
                  event.preventDefault();
                  setDragging(false);
                  acceptFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-control border border-dashed p-6 text-center',
                  dragging
                    ? 'border-accent-ink bg-accent'
                    : 'border-outline-edge bg-muted/40'
                )}
              >
                <Upload aria-hidden className="size-8 text-muted-foreground" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Tarik foto ke sini</span> atau{' '}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Pilih file
                  </Button>
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Foto atau tangkapan layar. JPG, PNG, atau WEBP, maksimal{' '}
              {MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.
            </p>
            {errors.screenshot?.message ? (
              <p role="alert" className="text-sm text-destructive-ink">
                {errors.screenshot.message}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
              disabled={isSubmitting || disabledReason !== null}
            >
              <Upload aria-hidden />
              {isSubmitting ? 'Mengirim…' : 'Kirim permintaan top-up'}
            </Button>
            {disabledReason ? (
              <p className="text-center text-sm text-muted-foreground">{disabledReason}</p>
            ) : null}
          </div>
          </Card>
        </div>

        <Card className="order-2 px-5 py-5 lg:col-start-2 lg:row-start-1 lg:p-6">
          <StepHeading step={2}>Transfer ke rekening ini</StepHeading>

          {bankConfigured && bankAccount ? (
            <>
              <div className="mt-2 divide-y divide-border">
                <BankRow label="Bank" value={bankAccount.bank_name} />
                <BankRow
                  label="Nomor rekening"
                  value={bankAccount.bank_account_number}
                  numeric
                  copy={{ value: bankAccount.bank_account_number, label: 'nomor rekening' }}
                />
                <BankRow label="Atas nama" value={bankAccount.bank_account_holder} />
                <BankRow
                  label="Nominal transfer"
                  value={parsed.ok ? formatPrice(parsed.amount) : '—'}
                  numeric
                  copy={parsed.ok ? { value: String(parsed.amount), label: 'nominal' } : undefined}
                />
              </div>
              <div className="mt-4 flex gap-3 rounded-control bg-accent px-4 py-3 text-sm text-accent-ink">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                <p>
                  Transfer tepat sesuai nominal. Admin mencocokkan mutasi, biasanya kurang dari 60
                  menit, lalu saldo bertambah.
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {bankAccount
                ? 'Rekening tujuan belum diatur. Hubungi admin.'
                : 'Rekening tujuan belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.'}
            </p>
          )}
        </Card>
      </form>

      <section aria-labelledby="riwayat-saldo" className="grid gap-3">
        <h2 id="riwayat-saldo" className="font-heading text-lg font-semibold text-foreground">
          Riwayat saldo
        </h2>

        <RenderIf when={failed}>
          {() => (
            <Card className="border-destructive-ink/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle aria-hidden className="size-4 text-destructive-ink" />
                  Gagal memuat riwayat saldo
                </CardTitle>
                <CardDescription>
                  Sebagian data tidak bisa ditampilkan saat ini. Muat ulang halaman untuk mencoba
                  lagi.
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          )}
        </RenderIf>

        <RenderIf when={!failed && history.length ? history : null}>
          {(rows) => (
            <div className="overflow-hidden rounded-card border border-card-edge bg-card">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">Riwayat saldo dan top-up, terbaru di atas</caption>
                <thead className="hidden lg:table-header-group">
                  <tr className="border-b border-divider text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Tanggal
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Keterangan
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-b border-divider px-4 py-3 last:border-b-0 lg:table-row lg:px-0 lg:py-0"
                    >
                      <td className="order-3 whitespace-nowrap text-sm text-muted-foreground tabular-nums lg:table-cell lg:px-4 lg:py-3 lg:align-top">
                        <span className="sr-only">Tanggal: </span>
                        {formatDeadline(row.created_at)} WIB
                      </td>
                      <td className="order-4 col-span-2 min-w-0 lg:table-cell lg:px-4 lg:py-3 lg:align-top">
                        <span className="sr-only">Keterangan: </span>
                        <p className="font-semibold text-foreground">{row.keterangan}</p>
                        {row.kind === 'topup' && row.status === 'rejected' && row.reason ? (
                          <p className="mt-1 text-sm text-destructive-ink">{row.reason}</p>
                        ) : null}
                        {row.kind === 'topup' && row.status === 'rejected' ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto px-0"
                            onClick={() => resend(row.amount)}
                          >
                            Kirim ulang bukti
                          </Button>
                        ) : null}
                      </td>
                      <td className="order-2 justify-self-end lg:table-cell lg:px-4 lg:py-3 lg:align-top">
                        <span className="sr-only">Status: </span>
                        <HistoryStatus row={row} />
                      </td>
                      <td className="order-1 whitespace-nowrap font-semibold tabular-nums lg:table-cell lg:px-4 lg:py-3 lg:text-right lg:align-top">
                        <span className="sr-only">Jumlah: </span>
                        <span className={row.amount < 0 ? 'text-foreground' : 'text-success'}>
                          {formatSignedAmount(row.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RenderIf>

        <RenderIf when={!failed && !history.length}>
          {() => (
            <EmptyFeed
              icon={<Banknote aria-hidden className="size-8" />}
              iconClassName="size-16 rounded-full border border-border bg-muted"
              titleClassName="font-heading text-lg font-bold sm:text-xl"
              narrowing={false}
              noMatchTitle="Belum ada transaksi"
              noMatchBody="Top-up, biaya lelang dan koreksi muncul di sini."
            />
          )}
        </RenderIf>
      </section>
    </AccountFrame>
  );
}

function StepHeading({ step, children }: { step: number; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-base font-semibold text-foreground">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
      >
        {step}
      </span>
      {children}
    </h2>
  );
}

// The design's quick amounts read "5 jt", not "Rp 5 jt"; the field below shows
// the full rupiah value once one is chosen.
function chipLabel(value: number) {
  return formatPriceCompact(value).replace(/^Rp[\s ]*/, '');
}

function BankRow({
  label,
  value,
  numeric,
  copy
}: {
  label: string;
  value: string;
  numeric?: boolean;
  copy?: { value: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            'text-base font-semibold text-foreground',
            numeric && 'tabular-nums tracking-wide'
          )}
        >
          {value}
        </p>
      </div>
      {copy ? <CopyValue value={copy.value} label={copy.label} /> : null}
    </div>
  );
}

function HistoryStatus({ row }: { row: WalletHistoryEntry }) {
  if (row.kind === 'wallet') {
    return row.amount < 0 ? (
      <Badge variant="neutral" icon={<CheckCircle2 />}>
        Selesai
      </Badge>
    ) : (
      <Badge variant="success" icon={<CheckCircle2 />}>
        Masuk ke saldo
      </Badge>
    );
  }

  return <TopupStatus status={row.status} />;
}

function TopupStatus({ status }: { status: TopupRequestStatus }) {
  if (status === 'approved') {
    return (
      <Badge variant="success" icon={<CheckCircle2 />}>
        Masuk ke saldo
      </Badge>
    );
  }

  if (status === 'rejected') {
    return (
      <Badge variant="signal" icon={<XCircle />}>
        Ditolak
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" icon={<Clock />}>
      Menunggu
    </Badge>
  );
}

// The table signs every amount so a credit and a charge read apart at a glance.
function formatSignedAmount(amount: number) {
  return `${amount < 0 ? '−' : '+'} ${formatPrice(Math.abs(amount))}`;
}
