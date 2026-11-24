'use client';

import { MessageSquareText } from 'lucide-react';

import { EmptyFeed } from '@/components/cells/EmptyFeed/EmptyFeed';
import { ChatInbox } from '@/components/cells/ChatInbox/ChatInbox';
import { useChatEnabled } from '@/lib/hooks/use-chat-enabled';
import type { AccountIdentity } from './AccountFrame';

import { AccountFrame } from './AccountFrame';

export type MessagesProps = {
  openOrders: number;
  identity?: AccountIdentity;
};

export function Messages({ openOrders, identity }: MessagesProps) {
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
      identity={identity}
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
