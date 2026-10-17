'use client';

import type { PropsWithChildren } from 'react';

import { CartProvider } from '@/components/provider';
import type { Cart } from '@/types/cart';

interface ProvidersProps extends PropsWithChildren {
  cart: Cart | null;
}

export function Providers({ children, cart }: ProvidersProps) {
  return <CartProvider cart={cart}>{children}</CartProvider>;
}
