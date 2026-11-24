import { redirect } from 'next/navigation';

import { ROUTES } from '@/const/routes';
import { shippingDates } from '@/lib/helpers/shipping-date';
import {
  toShippingAddresses,
  toShippingParcels
} from '@/lib/adapters/shipping';
import { retrieveCart } from '@/lib/data/cart';
import { listCartShippingMethods } from '@/lib/data/fulfillment';
import { requireCustomer } from '@/lib/guard';

import { Checkout } from './components/Checkout';

export async function Shipping() {
  const cart = await retrieveCart();

  if (!cart?.items?.length) redirect(ROUTES.cart);

  const [options, customer] = await Promise.all([
    listCartShippingMethods(cart.id),
    requireCustomer(ROUTES.shipping)
  ]);

  const addresses = toShippingAddresses(customer);

  return (
    <Checkout
      cartId={cart.id}
      parcels={toShippingParcels(cart, options)}
      {...(addresses.length ? { addresses } : {})}
      {...(addresses.length ? { addressId: addresses[0]!.id } : {})}
      dates={shippingDates(4)}
    />
  );
}
