'use client';

import { useSession } from '@talkjs/react';

export function useChatEnabled(): boolean {
  const session = useSession();
  return Boolean(session);
}
