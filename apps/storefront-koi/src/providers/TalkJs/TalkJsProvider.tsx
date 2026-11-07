'use client';

import { Session } from '@talkjs/react';
import type { PropsWithChildren } from 'react';
import Talk from 'talkjs';

/** Props for {@link TalkJsProvider}. */
export type TalkJsProviderProps = PropsWithChildren<{
  appId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoUrl?: string;
}>;

/**
 * The TalkJS session every chat surface on the site reads.
 *
 * @remarks
 * One `Session` for the whole visit, mounted at the root: the inbox, a chat
 * box and the unread count in the header all read the same session, and a
 * second one per page would mount and destroy the SDK on every navigation.
 *
 * The signed-in customer is the session's `me`, so a chat box only has to say
 * who the *other* participant is — the shop no longer threads the customer
 * through every button the way `apps/storefront` does.
 */
export function TalkJsProvider({
  appId,
  userId,
  userName,
  userEmail,
  userPhotoUrl,
  children
}: TalkJsProviderProps) {
  return (
    <Session
      appId={appId}
      syncUser={() =>
        new Talk.User({
          id: userId,
          name: userName,
          email: userEmail,
          role: 'customer',
          ...(userPhotoUrl ? { photoUrl: userPhotoUrl } : {})
        })
      }
    >
      {children}
    </Session>
  );
}
