'use client';

import type { PropsWithChildren } from 'react';

import { CartProvider, TalkJsProvider } from '@/providers';
import type { Cart } from '@/types/medusa';

interface ProvidersProps extends PropsWithChildren {
  cart: Cart | null;
  chat?: {
    appId: string;
    userId: string;
    userName: string;
    userEmail: string;
  };
}

export function Providers({ children, cart, chat }: ProvidersProps) {
  const body = <CartProvider cart={cart}>{children}</CartProvider>;

  if (!chat) return body;

  return (
    <TalkJsProvider
      appId={chat.appId}
      userId={chat.userId}
      userName={chat.userName}
      userEmail={chat.userEmail}
    >
      {body}
    </TalkJsProvider>
  );
}
