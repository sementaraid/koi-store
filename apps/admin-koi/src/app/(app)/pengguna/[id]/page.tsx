import Link from 'next/link';
import type { Metadata } from 'next';

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@koi/ui';
import { AccountPhone } from '@/components/AccountPhone';
import { AccountTabs } from '@/components/AccountTabs';
import { FarmBidders } from '@/components/FarmBidders';
import { ROUTES } from '@/const/routes';
import {
  getAccount,
  getAccountWallet,
  listFarmBidders,
  listUserReports
} from '@/lib/data/accounts';
import { accountCreatedLabel, accountName } from '@/lib/helpers/account-format';
import { farmStatusLabel, farmStatusTone } from '@/lib/helpers/farm-format';
import { formatRupiah, formatTopupDate } from '@/lib/helpers/topup-format';
import { walletTransactionTypeLabel } from '@/lib/helpers/wallet-format';
import { requireAdmin } from '@/lib/guard';

export const metadata: Metadata = {
  title: 'Pengguna'
};

// US-070 T-070.2b/.2c (D-002, D-037, D-042): one user's profile with the masked
// phone and a logged reveal, the wallet (balance + 20 latest ledger rows), and
// US-059's strike panel with the user's Laporan tab. Ban comes from the API.
export default async function UserRoute({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(ROUTES.users);
  const { id } = await params;

  const result = await getAccount(id);
  if ('error' in result) {
    if (result.error === 'not_found') {
      return (
        <div className="grid gap-6">
          <div className="grid gap-1">
            <Link href={ROUTES.users} className="text-sm text-muted-foreground hover:underline">
              ← Kembali ke pengguna
            </Link>
            <h1 className="text-xl font-medium tracking-tight">Pengguna</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Pengguna tidak ditemukan</CardTitle>
              <CardDescription>
                Akun ini tidak ada. Kembali ke daftar dan pilih pengguna lain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={ROUTES.users}
                className="text-sm text-accent-ink underline underline-offset-4"
              >
                Kembali ke daftar
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="grid gap-6">
        <h1 className="text-xl font-medium tracking-tight">Pengguna</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat akun</CardTitle>
            <CardDescription>Muat ulang halaman untuk mencoba lagi.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  const { account } = result;
  const [wallet, reports, bidders] = await Promise.all([
    getAccountWallet(account.id),
    listUserReports(account.id),
    account.farm ? listFarmBidders(account.farm.id) : Promise.resolve(null)
  ]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <Link href={ROUTES.users} className="text-sm text-muted-foreground hover:underline">
          ← Kembali ke pengguna
        </Link>
        <h1 className="text-xl font-medium tracking-tight">{accountName(account)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={account.active_strikes >= 2 ? 'urgent' : 'muted'}>
            {account.active_strikes} strike aktif
          </Badge>
          <Badge variant={account.banned ? 'urgent' : 'neutral'}>
            {account.banned ? 'Diblokir' : 'Tidak diblokir'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Telepon tetap disamarkan sampai ditampilkan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email: </span>
            {account.email ?? '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Telepon: </span>
            <AccountPhone id={account.id} masked={account.phone} />
          </p>
          <p className="text-muted-foreground">
            Bergabung {accountCreatedLabel(account.created_at)}
          </p>
          {account.farm ? (
            <p>
              <span className="text-muted-foreground">Kebun: </span>
              {account.farm.name}{' '}
              <Badge variant={farmStatusTone(account.farm.status)}>
                {farmStatusLabel(account.farm.status)}
              </Badge>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {account.farm ? <FarmBidders list={bidders} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Saldo</CardTitle>
          <CardDescription>20 transaksi terakhir. Buku besar tidak pernah diubah.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {wallet === null ? (
            <p role="alert" className="text-sm text-destructive-ink">
              Gagal memuat saldo. Muat ulang halaman untuk mencoba lagi.
            </p>
          ) : (
            <>
              <p className="text-lg font-medium">{formatRupiah(wallet.balance)}</p>
              {wallet.transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
              ) : (
                <div className="grid gap-2">
                  {wallet.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      <div className="grid gap-0.5">
                        <p>{walletTransactionTypeLabel(transaction.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTopupDate(transaction.created_at)}
                          {transaction.reference ? ` · ${transaction.reference}` : ''}
                        </p>
                      </div>
                      <Badge variant={transaction.amount >= 0 ? 'info' : 'muted'}>
                        {formatRupiah(transaction.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moderasi</CardTitle>
          <CardDescription>Beri strike atau tinjau laporan akun ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountTabs customerId={account.id} reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
