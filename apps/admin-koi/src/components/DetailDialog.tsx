'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@koi/ui';
import { cn } from 'cn';

/* The admin record popup, laid out like the storefront lot page: a large media
   stage, the identity block, a dark price panel when the record carries money,
   then labelled definition sections divided by hairlines. It stays read-only;
   the row's actions remain in the table.

   The header is sticky inside DialogContent's own scroll area, so the title and
   close control stay visible while a long record scrolls. Base UI traps focus,
   closes on Esc and returns focus to the trigger. */

export type DetailDialogProps = {
  /** Accessible name of the trigger, including the row identifier. */
  triggerLabel: string;
  /** Short heading for the dialog header, e.g. "Detail lot". */
  title: string;
  description?: string;
  /** Evidence stage and media-only content; the left column from md up. */
  media?: ReactNode | ((open: boolean) => ReactNode);
  /** Identity, amount panel and sections; the right column from md up. */
  children: (open: boolean) => ReactNode;
  className?: string;
};

export function DetailDialog({
  triggerLabel,
  title,
  description,
  media,
  children,
  className
}: DetailDialogProps) {
  const [open, setOpen] = useState(false);
  const mediaNode = typeof media === 'function' ? media(open) : media;
  const hasMedia = Boolean(mediaNode);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" aria-label={triggerLabel} />}
      >
        Lihat detail
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden! p-0 sm:max-w-4xl',
          className
        )}
      >
        <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-divider bg-popover px-5 py-4 pe-5">
          <div className="grid min-w-0 gap-1">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </div>
          <DialogClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Tutup"
                className="shrink-0"
              />
            }
          >
            <CloseIcon />
          </DialogClose>
        </DialogHeader>

        <div
          data-slot="detail-body"
          tabIndex={-1}
          className={cn('min-h-0 flex-1 overflow-y-auto', hasMedia && 'md:overflow-hidden')}
        >
          <div
            data-slot="detail-grid"
            data-has-media={hasMedia ? 'true' : 'false'}
            className={cn(
              'grid gap-5 px-5 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-6',
              hasMedia && 'md:h-full md:overflow-hidden'
            )}
          >
            {hasMedia ? (
              <div
                data-slot="detail-media"
                tabIndex={-1}
                className="min-w-0 md:h-full md:overflow-y-auto md:pe-2"
              >
                {mediaNode}
              </div>
            ) : null}
            <div
              data-slot="detail-fields"
              tabIndex={-1}
              className={cn(
                'grid min-w-0 content-start gap-5',
                hasMedia ? 'md:h-full md:overflow-y-auto md:pe-2' : 'md:col-span-2'
              )}
            >
              {children(open)}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-divider px-5 py-3">
          <DialogClose render={<Button type="button" variant="outline" />}>Tutup</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export type DetailMediaItem = {
  src: string;
  kind: 'image' | 'video';
  alt: string;
  poster?: string;
};

/* The evidence stage. One image fills the frame; several images get a
   horizontal thumbnail strip that scrolls inside the dialog, so the stage
   height stays fixed. */
export function DetailMediaStage({
  items,
  className
}: {
  items: DetailMediaItem[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;

  const at = Math.min(index, items.length - 1);
  const active = items[at];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <DetailMediaFrame>
        {active.kind === 'video' ? (
          <video
            key={active.src}
            src={active.src}
            poster={active.poster}
            aria-label={active.alt}
            controls
            playsInline
            preload="metadata"
            className="size-full max-h-[420px] object-contain"
          />
        ) : (
          <img
            key={active.src}
            src={active.src}
            alt={active.alt}
            className="size-full max-h-[420px] object-contain"
          />
        )}
      </DetailMediaFrame>

      {items.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Pilih media" tabIndex={-1}>
          {items.map((item, itemIndex) => (
            <button
              key={`${item.src}-${itemIndex}`}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-pressed={itemIndex === at}
              className={cn(
                'h-16 w-20 shrink-0 overflow-hidden rounded-control border bg-surface',
                itemIndex === at ? 'border-primary ring-2 ring-ring' : 'border-divider'
              )}
            >
              {item.kind === 'video' ? (
                <video
                  src={item.src}
                  poster={item.poster}
                  muted
                  preload="metadata"
                  className="size-full object-cover"
                  aria-hidden
                />
              ) : (
                <img src={item.src} alt="" className="size-full object-cover" aria-hidden />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* The same stage, for a viewer that owns its own private blob state. */
export function DetailMediaFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex aspect-4/3 max-h-[420px] w-full items-center justify-center overflow-hidden rounded-control bg-surface">
      {children}
    </div>
  );
}

export function DetailIdentity({
  title,
  badge,
  secondary
}: {
  title: string;
  badge?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {badge ? <div className="flex flex-wrap items-center gap-1.5">{badge}</div> : null}
      <h3 className="font-heading text-xl leading-[34px] font-bold tracking-[-0.01em] text-balance lg:text-2xl lg:leading-10 lg:font-semibold">
        {title}
      </h3>
      {secondary ? <p className="text-[15px] text-muted-foreground">{secondary}</p> : null}
    </div>
  );
}

export function DetailPricePanel({
  label,
  value,
  note
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1 rounded-dialog bg-price-panel p-4 text-price-panel-foreground">
      <span className="text-sm text-price-panel-foreground/80">{label}</span>
      <span className="text-2xl leading-10 font-bold whitespace-nowrap tabular-nums">
        {value}
      </span>
      {note ? (
        <span className="text-sm text-price-panel-foreground/80">{note}</span>
      ) : null}
    </section>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h4>
      <dl className="flex flex-col">{children}</dl>
    </section>
  );
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-divider py-2.5 text-sm last:border-b-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end font-semibold text-pretty">{children}</dd>
    </div>
  );
}
