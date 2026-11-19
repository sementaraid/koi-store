'use client';

import { Inbox } from '@talkjs/react';
import { useCallback } from 'react';
import type Talk from 'talkjs';

function conversationIdFor(meId: string) {
  return `koi-inbox-${meId}`;
}

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
