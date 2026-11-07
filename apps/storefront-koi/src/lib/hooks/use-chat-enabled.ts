'use client';

import { useSession } from '@talkjs/react';

/**
 * Whether a TalkJS session exists on this page.
 *
 * @remarks
 * The session is mounted at the root only when the app id is set and someone is
 * signed in — see `app/layout.tsx`. Every chat control reads this rather than
 * `NEXT_PUBLIC_TALKJS_APP_ID` directly, so "the env var is set but nobody is
 * signed in" reads the same as "chat is off" instead of drawing a control that
 * cannot open a conversation.
 */
export function useChatEnabled(): boolean {
  const session = useSession();
  return Boolean(session);
}
