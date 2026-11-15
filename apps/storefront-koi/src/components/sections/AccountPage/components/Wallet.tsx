import { AlertTriangle, WalletIcon } from 'lucide-react';

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, RenderIf } from '@koi/ui';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { FeedPagination } from '@/components/cells/FeedPagination/FeedPagination';
import { ROUTES } from '@/const/routes';
import type { WalletPage } from '@/lib/data/wallet';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatPrice } from '@/lib/helpers/format-price';
import { walletTransactionLabel } from '@/lib/helpers/wallet-transaction-label';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';

/** Props for {@link Wallet}. */
export type WalletProps = {
  wallet: WalletPage;
  /** The fetch failed — a real "balance 0" is `wallet.count === 0` and no
      error; this is "the house doesn't actually know the balance right now",
      which draws a retry card instead of a wrong Rp 0. */
  failed: boolean;
  pageCount: number;
  page: number;
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/** Balance and every transaction, newest first (US-010). */
export function Wallet({ wallet, failed, pageCount, page, openOrders, account, cart }: WalletProps) {
  return (
    <AccountFrame
      title="Saldo"
      eyebrow={
        <>
          <WalletIcon
            aria-hidden
            className="size-3.5"
          />
          Dompet
        </>
      }
      description="Saldo hanya untuk membayar biaya lelang — tidak bisa ditarik atau dipindahkan."
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      <RenderIf when={failed}>
        {() => (
          <Card className="border-destructive-ink/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  aria-hidden
                  className="size-4 text-destructive-ink"
                />
                Gagal memuat saldo
              </CardTitle>
              <CardDescription>
                Saldo dan riwayat transaksi tidak bisa ditampilkan saat ini. Muat ulang halaman
                untuk mencoba lagi.
              </CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!failed}>
        {() => (
          <Card className="px-5 py-4">
            <p className="text-sm text-muted-foreground">Saldo saat ini</p>
            <p className="mt-1 font-heading text-3xl font-extrabold text-foreground tabular-nums">
              {formatPrice(wallet.balance)}
            </p>
          </Card>
        )}
      </RenderIf>

      <RenderIf when={!failed && wallet.transactions.length ? wallet.transactions : null}>
        {(list) => (
          <div>
            <Card className="px-5 py-1">
              {list.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">
                      {walletTransactionLabel(transaction.type)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[transaction.reference, formatDeadline(transaction.created_at)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <Badge variant={transaction.amount < 0 ? 'muted' : 'info'}>
                    {transaction.amount < 0 ? '−' : '+'}
                    {formatPrice(Math.abs(transaction.amount))}
                  </Badge>
                </div>
              ))}
            </Card>

            <FeedPagination
              page={page}
              pageCount={pageCount}
              href={ROUTES.wallet}
            />
          </div>
        )}
      </RenderIf>

      <RenderIf when={!failed && !wallet.transactions.length}>
        {() => (
          <EmptyFeed
            icon={<WalletIcon aria-hidden />}
            narrowing={false}
            noMatchTitle="Belum ada transaksi"
            noMatchBody="Transaksi top-up, biaya lelang dan koreksi muncul di sini."
          />
        )}
      </RenderIf>
    </AccountFrame>
  );
}
