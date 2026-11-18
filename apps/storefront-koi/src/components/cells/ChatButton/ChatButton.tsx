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

export type ChatPartner = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

export type ChatButtonProps = {
  partner: ChatPartner;
  subject?: string | null;
  topicId?: string;
  label?: string;
  variant?: ButtonVariant['variant'];
  size?: ButtonVariant['size'];
};

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
