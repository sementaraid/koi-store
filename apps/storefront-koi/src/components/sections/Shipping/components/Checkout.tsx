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
    />
  );
}
