import Link from 'next/link';
import type { Metadata } from 'next';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@koi/ui';
import { AccountPhone } from '@/components/AccountPhone';
import { AccountTabs } from '@/components/AccountTabs';
import { AdminEmpty } from '@/components/AdminEmpty';
import { AdminError } from '@/components/AdminError';
import { AdminPageHeader } from '@/components/AdminPageHeader';
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
          <AdminPageHeader
            title="Pengguna"
            back={
              <Link
                href={ROUTES.users}
                className="text-sm text-muted-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                ← Kembali ke pengguna
              </Link>
            }
          />
          <AdminEmpty
            title="Pengguna tidak ditemukan"
            description="Akun ini tidak ada. Kembali ke daftar dan pilih pengguna lain."
            action={
              <Button render={<Link href={ROUTES.users} />} variant="outline">
                Kembali ke daftar
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <div className="grid gap-6">
        <AdminPageHeader title="Pengguna" />
        <AdminError title="Gagal memuat akun" description="Profil akun ini tidak dapat dimuat." />
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
      <AdminPageHeader
        title={accountName(account)}
        back={
          <Link
            href={ROUTES.users}
            className="text-sm text-muted-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            ← Kembali ke pengguna
          </Link>
        }
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={account.active_strikes >= 2 ? 'urgent' : 'muted'}>
              {account.active_strikes} strike aktif
            </Badge>
            <Badge variant={account.banned ? 'urgent' : 'neutral'}>
              {account.banned ? 'Diblokir' : 'Tidak diblokir'}
            </Badge>
          </div>
        }
      />

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
            <AdminError title="Gagal memuat saldo" description="Saldo akun ini tidak dapat dimuat." />
          ) : (
            <>
              <p className="text-lg font-medium">{formatRupiah(wallet.balance)}</p>
              {wallet.transactions.length === 0 ? (
                <AdminEmpty
                  title="Belum ada transaksi"
                  description="Mutasi dan koreksi saldo akan muncul di sini."
                />
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
          <CardDescription>Beri strike atau tinjau arsip laporan akun ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountTabs customerId={account.id} reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
