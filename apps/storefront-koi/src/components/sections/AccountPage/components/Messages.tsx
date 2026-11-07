'use client';

import { MessageSquareText } from 'lucide-react';

import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { ChatInbox } from '@/components/cells/ChatInbox/ChatInbox';
import { useChatEnabled } from '@/lib/hooks/use-chat-enabled';
import type { HeaderAccount, HeaderCart } from '@/types/header';

import { AccountFrame } from './AccountFrame';

/** Props for {@link Messages}. */
export type MessagesProps = {
  openOrders: number;
  account?: HeaderAccount;
  cart?: HeaderCart;
};

/**
 * The customer's message inbox.
 *
 * @remarks
 * The chat provider is mounted at the root and only when `NEXT_PUBLIC_TALKJS_APP_ID`
 * is set, so a deployment without one gets an honest empty state rather than a
 * blank panel where the SDK would have been. `useChatEnabled` reads the same
 * session the provider would have created.
 */
export function Messages({ openOrders, account, cart }: MessagesProps) {
  const chatEnabled = useChatEnabled();

  return (
    <AccountFrame
      title="Pesan"
      eyebrow={
        <>
          <MessageSquareText
            aria-hidden
            className="size-3.5"
          />
          Akun
        </>
      }
      description="Percakapan Anda dengan para penjual."
      openOrders={openOrders}
      account={account}
      cart={cart}
    >
      {chatEnabled ? (
        <ChatInbox />
      ) : (
        <EmptyFeed
          icon={<MessageSquareText aria-hidden />}
          narrowing={false}
          noMatchTitle="Pesan belum tersedia"
          noMatchBody="Fitur pesan belum diaktifkan di situs ini."
        />
      )}
    </AccountFrame>
  );
}
