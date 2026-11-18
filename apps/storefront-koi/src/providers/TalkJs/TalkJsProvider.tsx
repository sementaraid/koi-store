'use client';

import { Session } from '@talkjs/react';
import type { PropsWithChildren } from 'react';
import Talk from 'talkjs';

export type TalkJsProviderProps = PropsWithChildren<{
  appId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoUrl?: string;
}>;

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
