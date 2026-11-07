'use client';

import { useUnreads } from '@talkjs/react';
import { MessagesSquare } from 'lucide-react';

import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from '@/components/atoms/RenderIf/RenderIf';
import { ROUTES } from '@/const/routes';

/**
 * The inbox door on the bar, with how many threads have unread messages.
 *
 * @remarks
 * Drawn only inside a TalkJS session — `useUnreads` returns `undefined` when
 * there is none, which is also the answer for "chat is not configured", so a
 * site without an app id has no door to a page that cannot load.
 *
 * The count counts *conversations* with something unread, not messages: a
 * badge reading "7" over one shop reads as seven different shops waiting.
 *
 * Hidden below `lg` for the same reason `CartLink` is — the phone bar already
 * carries a back control, the search field and the bell, and the account pages
 * are in the bottom nav there.
 */
export function ChatLink() {
  const unreads = useUnreads();

  if (!unreads) return null;

  return (
    <Link
      href={ROUTES.messages}
      aria-label={
        unreads.length ? `Pesan, ${unreads.length} percakapan belum dibaca` : 'Pesan'
      }
      className="relative hidden items-center text-foreground outline-none hover:text-accent-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:flex"
    >
      <MessagesSquare
        aria-hidden
        className="size-5"
      />
      <RenderIf when={unreads.length}>
        {(count) => (
          <span className="absolute -end-1.5 -top-1 min-w-4 rounded-full bg-destructive px-1 text-center text-2xs font-bold text-background tabular-nums">
            {count}
          </span>
        )}
      </RenderIf>
    </Link>
  );
}
