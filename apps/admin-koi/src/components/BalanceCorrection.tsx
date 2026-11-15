'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField } from '@koi/ui';
import { NativeSelect, NativeSelectOption } from '@koi/ui/primitives/native-select';
import {
  adjustWalletBalance,
  getCustomerWallet,
  searchCustomers,
  type CustomerWallet,
  type WalletCustomer
} from '@/lib/data/wallet-adjustments';
import { formatRupiah, formatTopupDate } from '@/lib/helpers/topup-format';
import { walletTransactionTypeLabel } from '@/lib/helpers/wallet-format';

/** The customer's name, or email when there is none. */
function customerName(customer: WalletCustomer): string {
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
  return name || customer.email;
}

/**
 * The balance correction screen (US-013): find a customer, see their balance
 * and recent history, then record a signed adjustment with a written reason.
 *
 * @remarks
 * Search and the ledger both come from server actions on demand — there is no
 * list to seed this with, unlike the top-up queue — so the component owns its
 * own loading/empty/error states for each step rather than receiving props.
 */
export function BalanceCorrection() {
  const [selected, setSelected] = useState<WalletCustomer | null>(null);
  const [wallet, setWallet] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; data: CustomerWallet }
  >({ status: 'idle' });

  async function selectCustomer(customer: WalletCustomer) {
    setSelected(customer);
    setWallet({ status: 'loading' });
    const data = await getCustomerWallet(customer.id);
    setWallet(data ? { status: 'ready', data } : { status: 'error' });
  }

  function applyAdjustment(transaction: CustomerWallet['transactions'][number], balance: number) {
    setWallet((prev) =>
      prev.status === 'ready'
        ? { status: 'ready', data: { ...prev.data, balance, transactions: [transaction, ...prev.data.transactions] } }
        : prev
    );
  }

  return (
    <div className="grid gap-4">
      <CustomerSearch onSelect={selectCustomer} selected={selected} />

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>{customerName(selected)}</CardTitle>
            <CardDescription>{selected.email}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {wallet.status === 'loading' || wallet.status === 'idle' ? (
              <p className="text-sm text-muted-foreground">Memuat saldo…</p>
            ) : wallet.status === 'error' ? (
              <p role="alert" className="text-sm text-destructive-ink">
                Gagal memuat saldo. Muat ulang untuk mencoba lagi.
              </p>
            ) : (
              <>
                <p className="text-lg font-medium">{formatRupiah(wallet.data.balance)}</p>

                <AdjustmentForm customerId={selected.id} onSuccess={applyAdjustment} />

                <div className="grid gap-2">
                  <h2 className="text-sm font-medium">Riwayat transaksi</h2>
                  {wallet.data.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
                  ) : (
                    wallet.data.transactions.map((t: CustomerWallet['transactions'][number]) => (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                      >
                        <div className="grid gap-0.5">
                          <p>{walletTransactionTypeLabel(t.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTopupDate(t.created_at)}
                            {t.reference ? ` · ${t.reference}` : ''}
                            {t.created_by ? ` · ${t.created_by}` : ''}
                          </p>
                        </div>
                        <Badge variant={t.amount >= 0 ? 'info' : 'muted'}>{formatRupiah(t.amount)}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Find the customer to correct, by name or email (Medusa core's
    `GET /admin/customers?q=`). */
function CustomerSearch({
  onSelect,
  selected
}: {
  onSelect: (customer: WalletCustomer) => void;
  selected: WalletCustomer | null;
}) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; results: WalletCustomer[] }
  >({ status: 'idle' });

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setState({ status: 'loading' });
    const results = await searchCustomers(query);
    setState(results ? { status: 'ready', results } : { status: 'error' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Koreksi saldo</CardTitle>
        <CardDescription>Cari pelanggan berdasarkan nama atau email.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <form onSubmit={search} className="flex gap-2" noValidate>
          <FormField
            label="Cari pelanggan"
            className="flex-1"
            placeholder="Nama atau email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={state.status === 'loading'} className="self-end">
            {state.status === 'loading' ? 'Mencari…' : 'Cari'}
          </Button>
        </form>

        {state.status === 'error' ? (
          <p role="alert" className="text-sm text-destructive-ink">
            Gagal mencari pelanggan. Coba lagi.
          </p>
        ) : null}

        {state.status === 'ready' && state.results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada pelanggan yang cocok.</p>
        ) : null}

        {state.status === 'ready' && state.results.length > 0 ? (
          <div className="grid gap-1">
            {state.results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelect(customer)}
                className="rounded-md border border-border p-2 text-left text-sm hover:bg-muted data-[selected=true]:border-ring"
                data-selected={selected?.id === customer.id}
              >
                <p className="font-medium">{customerName(customer)}</p>
                <p className="text-xs text-muted-foreground">{customer.email}</p>
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* A correction moves money without a bank statement behind it, so direction,
   a positive whole-rupiah amount, and a written reason are all required
   (US-013 AC1, admin-koi's security rule on money actions). This schema is
   for the form's own feedback only — `adjustWalletBalance` revalidates the
   same shape and is the one place that turns direction × magnitude into the
   signed amount the backend stores. */
const adjustmentSchema = z.object({
  direction: z.enum(['add', 'subtract']),
  amount: z.number({ message: 'Masukkan jumlah' }).int('Jumlah harus bilangan bulat').min(1, 'Jumlah minimal Rp 1'),
  reason: z.string().trim().min(1, 'Masukkan alasan koreksi')
});

type AdjustmentData = z.infer<typeof adjustmentSchema>;

function AdjustmentForm({
  customerId,
  onSuccess
}: {
  customerId: string;
  onSuccess: (transaction: CustomerWallet['transactions'][number], balance: number) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AdjustmentData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { direction: 'add', amount: 0, reason: '' }
  });

  async function submit(data: AdjustmentData) {
    const verb = data.direction === 'add' ? 'Tambah' : 'Kurangi';

    if (!confirm(`${verb} saldo pelanggan sebesar ${formatRupiah(data.amount)}?`)) {
      return;
    }

    const result = await adjustWalletBalance(customerId, data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Koreksi saldo disimpan.');
    onSuccess(result.wallet_transaction, result.balance);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-3 rounded-md border border-border p-3" noValidate>
      <h2 className="text-sm font-medium">Koreksi baru</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="direction">
            Arah
          </label>
          <NativeSelect id="direction" {...register('direction')}>
            <NativeSelectOption value="add">Tambah saldo</NativeSelectOption>
            <NativeSelectOption value="subtract">Kurangi saldo</NativeSelectOption>
          </NativeSelect>
        </div>
        <FormField
          label="Jumlah (Rp)"
          type="number"
          min={1}
          step={1}
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
      </div>
      <FormField
        label="Alasan"
        hint="Dicatat bersama akun admin yang membuat koreksi ini."
        error={errors.reason?.message}
        {...register('reason')}
      />
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan…' : 'Simpan koreksi'}
        </Button>
      </div>
    </form>
  );
}
