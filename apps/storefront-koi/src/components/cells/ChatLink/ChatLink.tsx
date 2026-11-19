'use client';

import { useUnreads } from '@talkjs/react';
import { MessagesSquare } from 'lucide-react';

import { Link } from '@/components/atoms/Link/Link';
import { RenderIf } from "@koi/ui";
import { ROUTES } from '@/const/routes';

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
