'use client';

import { Inbox } from '@talkjs/react';
import { useCallback } from 'react';
import type Talk from 'talkjs';

/** The customer's own thread with the site itself — the conversation the inbox
    hangs every other thread under. Its id is per-customer, so two customers
    never share a feed. */
function conversationIdFor(meId: string) {
  return `koi-inbox-${meId}`;
}

/**
 * Every conversation the customer has, in the TalkJS inbox.
 *
 * @remarks
 * `syncConversation` is the inbox's own hook into the session: TalkJS creates a
 * conversation for the signed-in customer and lists every other thread they
 * share with a shop beneath it. Same construction `apps/storefront` uses, with
 * the id namespaced so both storefronts can share one TalkJS app without their
 * feeds colliding.
 */
export function ChatInbox() {
  const syncConversation = useCallback((session: Talk.Session) => {
    const conversation = session.getOrCreateConversation(
      conversationIdFor(session.me.id)
    );
    conversation.setParticipant(session.me);
    return conversation;
  }, []);

  return (
    <div className="h-[clamp(420px,65svh,655px)] w-full">
      <Inbox
        syncConversation={syncConversation}
        className="h-full w-full"
        loadingComponent={
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Memuat pesan…
          </div>
        }
      />
    </div>
  );
}
