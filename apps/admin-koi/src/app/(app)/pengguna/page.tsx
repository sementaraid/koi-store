import Link from 'next/link';
import type { Metadata } from 'next';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input
} from '@koi/ui';
import { ROUTES, userHref } from '@/const/routes';
import { listAccounts } from '@/lib/data/accounts';
import { accountCreatedLabel, accountName } from '@/lib/helpers/account-format';
import { farmStatusLabel, farmStatusTone } from '@/lib/helpers/farm-format';
import { formatRupiah } from '@/lib/helpers/topup-format';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pengguna'
};

// US-070 T-070.2a (D-002): search by name or email so an admin never has to
// page through the whole list. The search is a plain GET form, so it works
// without JavaScript and the term stays in the URL.
export default async function UsersRoute({
  searchParams
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireAdmin(ROUTES.users);

  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  const list = await listAccounts(q);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Cari akun berdasarkan nama atau email untuk melihat saldo, strike, dan laporan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar pengguna</CardTitle>
          <CardDescription>Akun terbaru di atas. Telepon tetap disamarkan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <form action={ROUTES.users} className="flex flex-wrap gap-2" noValidate>
            <Input
              type="search"
              name="q"
              defaultValue={q}
              maxLength={100}
              placeholder="Nama atau email"
              aria-label="Cari pengguna"
              className="min-w-0 flex-1"
            />
            <Button type="submit">Cari</Button>
          </form>

          {list ? (
            <>
              {list.count > list.accounts.length ? (
                <p className="text-sm text-muted-foreground">
                  Menampilkan {list.accounts.length} dari {list.count} pengguna. Persempit
                  pencarian untuk melihat sisanya.
                </p>
              ) : null}
              {list.accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {q ? 'Tidak ada pengguna yang cocok.' : 'Belum ada pengguna.'}
                </p>
              ) : (
                <div className="grid gap-1">
                  {list.accounts.map((account) => (
                    <Link
                      key={account.id}
                      href={userHref(account.id)}
                      className="grid gap-1 rounded-md border border-border p-3 text-sm hover:bg-muted sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
                    >
                      <div className="grid gap-0.5">
                        <p className="font-medium">{accountName(account)}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.email ?? '—'} · {account.phone ?? 'Tanpa telepon'} · Bergabung{' '}
                          {accountCreatedLabel(account.created_at)}
                        </p>
                        {account.farm ? (
                          <p className="text-xs text-muted-foreground">
                            Kebun: {account.farm.name}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm">{formatRupiah(account.balance)}</span>
                        <Badge variant={account.active_strikes >= 2 ? 'urgent' : 'muted'}>
                          {account.active_strikes} strike aktif
                        </Badge>
                        <Badge variant={account.banned ? 'urgent' : 'neutral'}>
                          {account.banned ? 'Diblokir' : 'Tidak diblokir'}
                        </Badge>
                        {account.farm ? (
                          <Badge variant={farmStatusTone(account.farm.status)}>
                            {farmStatusLabel(account.farm.status)}
                          </Badge>
                        ) : null}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p role="alert" className="text-sm text-destructive-ink">
              Gagal memuat daftar pengguna. Muat ulang halaman untuk mencoba lagi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
