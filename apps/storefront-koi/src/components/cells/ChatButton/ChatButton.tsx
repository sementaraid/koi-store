'use client';

import { useSession } from '@talkjs/react';
import { MessageSquareText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Talk from 'talkjs';

import { Button, buttonVariants } from "@koi/ui";
import type { VariantProps } from 'class-variance-authority';

type ButtonVariant = VariantProps<typeof buttonVariants>;
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@koi/ui/primitives/sheet';

/** The shop at the other end of a conversation.
 *
 * @remarks
 * No email: TalkJS identifies a participant by `id`, and the public seller
 * routes do not expose an email anyway — asking for one would mean requesting a
 * field a shop never published so the buyer could reach them. */
export type ChatPartner = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

/** Props for {@link ChatButton}. */
export type ChatButtonProps = {
  partner: ChatPartner;
  /** What the conversation is about — the koi, usually. Doubles as the chat
      header's title. */
  subject?: string | null;
  /** Ties the conversation to a thing, so the same customer and shop get one
      thread per koi rather than one per visit. Defaults to the subject. */
  topicId?: string;
  /** Visible words. @defaultValue `"Hubungi penjual"` */
  label?: string;
  variant?: ButtonVariant['variant'];
  size?: ButtonVariant['size'];
};

/**
 * The way into a chat with one shop, in a sheet.
 *
 * @remarks
 * Drawn only when a TalkJS session exists — no app id, or a visitor who is not
 * signed in, and there is nothing to open a chat with, so the control is absent
 * rather than dead. `useSession` is what tells us; it reads the provider
 * mounted in `app/providers.tsx`, which is null when either condition fails.
 *
 * The conversation id is built from the customer, the shop and the subject —
 * the same three parts `apps/storefront` uses, so a thread that pair already
 * opened on a koi continues here rather than starting a second one.
 */
export function ChatButton({
  partner,
  subject,
  topicId,
  label = 'Hubungi penjual',
  variant = 'outline',
  size = 'sm'
}: ChatButtonProps) {
  const session = useSession();
  const [open, setOpen] = useState(false);

  const me = session?.me;
  if (!session || !me || !partner.id) return null;

  const conversationId = `koi-${topicId ?? subject ?? 'chat'}-${me.id}-${partner.id}`;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
      >
        <MessageSquareText
          aria-hidden
          className="size-4"
        />
        {label}
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
      >
        <SheetContent className="gap-0">
          <SheetHeader>
            <SheetTitle>{partner.name}</SheetTitle>
            <SheetDescription>
              {subject ? `Tentang ${subject}` : 'Tanya langsung ke penjual.'}
            </SheetDescription>
          </SheetHeader>
          {/* Kept mounted only while open: the box builds a session-side
              conversation and a UI box, and destroying both on close is what
              keeps a long browsing session from leaking them. */}
          {open && (
            <ChatBox
              session={session}
              partner={partner}
              conversationId={conversationId}
              subject={subject ?? undefined}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The mounted TalkJS chat box, for the one conversation the sheet is about. */
function ChatBox({
  session,
  partner,
  conversationId,
  subject
}: {
  session: Talk.Session;
  partner: ChatPartner;
  conversationId: string;
  subject?: string;
}) {
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* The session can be destroyed between the render that mounted this and
       the effect running — React's strict mode and hot reload both do it. */
    if (!node.current || !session.isAlive) return;

    const other = new Talk.User({
      id: partner.id,
      name: partner.name,
      role: 'seller',
      ...(partner.photoUrl ? { photoUrl: partner.photoUrl } : {})
    });

    const conversation = session.getOrCreateConversation(conversationId);
    if (subject) conversation.subject = subject;
    conversation.setParticipant(session.me);
    conversation.setParticipant(other);

    const chatbox = session.createChatbox();
    chatbox.select(conversation);
    void chatbox.mount(node.current);

    return () => chatbox.destroy();
  }, [session, partner, conversationId, subject]);

  return (
    <div
      ref={node}
      className="h-[500px] w-full"
    />
  );
}
