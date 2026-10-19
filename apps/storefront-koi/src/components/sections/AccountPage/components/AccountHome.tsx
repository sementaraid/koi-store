import type { HttpTypes } from '@medusajs/types';
import { AlarmClock, LayoutDashboard, MapPin, Package, UserRound } from 'lucide-react';

import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';
import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { OrderRow } from '@/components/cells/OrderRow/OrderRow';
import { StatCard } from '@/components/cells/StatCard/StatCard';
import { ROUTES, orderHref } from '@/const/routes';
import type { OrderGroup } from '@/lib/helpers/order-groups';
import { formatPrice } from '@/lib/helpers/format-price';
import { orderStatus } from '@/lib/helpers/order-status';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type { AccountOrder } from '@/types/order';

import { AccountFrame } from './AccountFrame';
import { SectionHead } from './SectionHead';

/** How many of the newest checkouts the home page lists before handing over to
    the orders page. Three is what fits above the fold beside the sidebar. */
const RECENT = 3;

/** Props for {@link AccountHome}. */
export type AccountHomeProps = {
  customer: HttpTypes.StoreCustomer;
  /** Every checkout the customer has made, newest first. */
  groups: OrderGroup<AccountOrder>[];
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * Where the customer stands with the house: what is owed, what is on its way,
 * and where it is being sent.
 *
 * @remarks
 * The page opens with whatever is *unfinished* — an unpaid checkout is drawn
 * above the welcome's own sections, because a customer who owes the house money
 * came here to pay it and should not have to find the row. When nothing is
 * outstanding the alert is not drawn at all rather than replaced with a
 * reassurance, which is a sentence nobody reads twice.
 */
export function AccountHome({ customer, groups, account, cart }: AccountHomeProps) {
  const name = customer.first_name || customer.email;
  const unpaid = groups.filter((group) => group.orders.some((o) => orderStatus(o).unpaid));
  const recent = groups.slice(0, RECENT);
  const address =
    customer.addresses?.find((a) => a.is_default_shipping) ?? customer.addresses?.[0];

  return (
    <AccountFrame
      title="Beranda akun"
      openOrders={unpaid.length}
      account={account}
      cart={cart}
      eyebrow={
        <>
          <LayoutDashboard
            aria-hidden
            className="size-3.5"
          />
          Beranda akun
        </>
      }
      heading={`Selamat datang ${name}`}
      description="Akun Anda, pesanan yang sedang berjalan, dan alamat pengiriman — semuanya di satu halaman."
      identity={{ name, email: customer.email }}
    >
      {/* The oldest unsettled checkout, because that is the one whose payment
          window runs out first. */}
      <RenderIf when={unpaid.at(-1)}>
        {(group) => (
          /* The cart's alarm band, worn by the dashboard: same tint, same glyph,
             same `role="status"` — an unsettled bill is the same fact here as it
             is in the cart, so it is said the same way. */
          <section
            role="status"
            aria-labelledby="akun-tagihan"
            className="flex flex-wrap items-center gap-3.5 rounded-xl bg-destructive/8 px-4 py-3.5"
          >
            <AlarmClock
              aria-hidden
              className="size-5 shrink-0 text-destructive-ink"
            />

            <div className="min-w-[200px] flex-1">
              <p
                id="akun-tagihan"
                className="text-sm leading-relaxed text-pretty"
              >
                <strong className="font-bold text-destructive-ink">
                  Menunggu pembayaran.
                </strong>{' '}
                <span className="text-muted-foreground">
                  {group.orders[0]?.items?.[0]?.product_title ??
                    group.orders[0]?.items?.[0]?.title ??
                    'Pesanan'}
                  {group.orders[0]?.seller?.name
                    ? ` · ${group.orders[0].seller.name}`
                    : ''}
                </span>
              </p>
            </div>

            <span className="font-heading text-lg font-extrabold text-destructive-ink tabular-nums">
              {formatPrice(group.total, group.currency_code)}
            </span>

            <Button
              render={<Link href={orderHref(group.id)} />}
              nativeButton={false}
            >
              Bayar sekarang
            </Button>
          </section>
        )}
      </RenderIf>

      <section aria-labelledby="akun-pesanan">
        <SectionHead
          id="akun-pesanan"
          title="Pesanan"
          href={ROUTES.orders}
        />

        <RenderIf when={recent.length ? recent : null}>
          {(list) => (
            <Card className="mt-4 px-5 py-1">
              {list.map((group) => (
                <OrderRow
                  key={group.id}
                  group={group}
                />
              ))}
            </Card>
          )}
        </RenderIf>

        <RenderIf when={!recent.length}>
          {() => (
            <EmptyFeed
              className="mt-5"
              icon={<Package aria-hidden />}
              narrowing={false}
              noMatchTitle="Belum ada pesanan"
              noMatchBody="Koi yang Anda menangkan di lelang dan barang yang Anda beli muncul di sini."
              action={
                <Button
                  render={<Link href={ROUTES.catalogs} />}
                  nativeButton={false}
                >
                  Lihat katalog
                </Button>
              }
            />
          )}
        </RenderIf>
      </section>

      <section
        aria-label="Ringkasan akun"
        className="grid gap-4 sm:grid-cols-2"
      >
        <StatCard
          label="Alamat utama"
          icon={MapPin}
          value={address?.city ?? 'Belum diisi'}
          note={address ? address.address_1 : 'Tambahkan alamat agar checkout lebih cepat.'}
          action={
            <Link
              href={ROUTES.addresses}
              className="font-medium text-accent-ink hover:underline"
            >
              Kelola alamat
            </Link>
          }
        />
        <StatCard
          label="Kontak"
          icon={UserRound}
          /* An address is longer than the figures this card is sized for, so
             it is set at body size and allowed to break rather than pushed
             out of the panel. */
          value={<span className="text-base break-all">{customer.email}</span>}
          note={customer.phone ?? 'Nomor telepon belum diisi.'}
          action={
            <Link
              href={ROUTES.settings}
              className="font-medium text-accent-ink hover:underline"
            >
              Ubah data akun
            </Link>
          }
        />
      </section>
    </AccountFrame>
  );
}
