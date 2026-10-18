import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { shippingDates } from '@/lib/helpers/shipping-date';
import {
  toShippingAddresses,
  toShippingParcels
} from '@/lib/adapters/shipping';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';
import { listCartShippingMethods } from '@/lib/data/fulfillment';
import { getShell } from '@/lib/shell';

import { Checkout } from './components/Checkout';

export async function Shipping() {
  const [{ account, cart: bar }, cart] = await Promise.all([
    getShell(),
    retrieveCart()
  ]);

  /* Nothing to deliver is not an error page — the visitor is sent back to the
     step that is actually theirs. */
  if (!cart?.items?.length) redirect(ROUTES.cart);

  const [options, customer] = await Promise.all([
    listCartShippingMethods(cart.id),
    retrieveCustomer().catch(() => null)
  ]);

  const addresses = toShippingAddresses(customer);

  return (
    <Checkout
      cartId={cart.id}
      parcels={toShippingParcels(cart, options)}
      /* A guest has no address book, and the kit's demo addresses are better
         than an empty picker until a form lands.
         ponytail: no address form here — `addCustomerAddress` exists in
         `lib/data/customer.ts`; wire `onAddAddress` to it when the page gets
         one. */
      {...(addresses.length ? { addresses } : {})}
      {...(addresses.length ? { addressId: addresses[0]!.id } : {})}
      dates={shippingDates(4)}
      account={account}
      cart={bar}
    />
  );
}
