'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/const/routes';
import { ShippingPage } from '@/components/sections/Shipping/components/ShippingPage';
import type { HeaderAccount, HeaderCart } from '@/types/header';
import type {
  ShippingAddress,
  ShippingDate,
  ShippingParcel
} from '@/types/shipping';
import { setShippingMethod } from '@/lib/data/cart';

/**
 * The delivery step, with the one decision that changes money — which option
 * each parcel takes — written back to the cart.
 *
 * The address is held here rather than on the server: Medusa stores addresses on
 * the customer, and a change of delivery address is not a cart mutation until
 * checkout sets it. The phone field is the page's own, per the kit.
 */
export function Checkout({
  cartId,
  parcels,
  addresses,
  addressId,
  dates,
  account,
  cart
}: {
  cartId: string;
  parcels: ShippingParcel[];
  /** Omitted for a guest, so the kit draws its own demo addresses. */
  addresses?: ShippingAddress[];
  addressId?: string;
  dates: ShippingDate[];
  account?: HeaderAccount;
  cart?: HeaderCart;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selectedAddress, setSelectedAddress] = useState(addressId);

  return (
    <ShippingPage
      parcels={parcels}
      {...(addresses ? { addresses } : {})}
      {...(selectedAddress ? { addressId: selectedAddress } : {})}
      dates={dates}
      account={account}
      cart={cart}
      onAddressChange={(address) => setSelectedAddress(address.id)}
      onChoiceChange={({ optionId }) => {
        if (pending) return;

        start(async () => {
          const result = await setShippingMethod({
            cartId,
            shippingMethodId: optionId
          });

          if (!result.ok) {
            toast.error('Gagal memilih pengiriman. Coba lagi.');
            return;
          }

          router.refresh();
        });
      }}
      onBack={() => router.push(ROUTES.cart)}
      /* ponytail: no payment step yet, so the last control goes nowhere. Wire it
         to the payment route when one lands. */
    />
  );
}
