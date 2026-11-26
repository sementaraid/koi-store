'use client';

import { cn } from 'cn';
import { Ticket, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@koi/ui';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger
} from '@koi/ui/primitives/sheet';
import { Link } from '@/components/atoms';
import { useBalanceSync } from '@/components/organisms/AppShell/BalanceSync';
import { signInHref, signUpHref, topupHref } from '@/const/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { joinLot } from '@/lib/data/lots';
import { formatPrice } from '@/lib/helpers/format-price';
import {
  JOIN_FEE_NOTE,
  joinBalanceAfter,
  joinConfirmLabel,
  joinFailureInfo,
  joinFeeLabel,
  joinGuestCopy,
  joinPanelState,
  joinShortfall,
  type JoinControl,
  type JoinFailure
} from '@/lib/helpers/join-auction';
import { formatEndTime } from '@/lib/helpers/lot-card';
import type { LotRule } from '@/lib/helpers/lot-rules';

import { LotRules } from './LotRules';

type JoinAuctionProps = JoinControl & {
  title: string;
  rules: LotRule[];
  /* US-099 AC11: the mobile bar opens this same dialog, so its open state can
     live one level up. Uncontrolled when these are omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function PriceRow({ label, value, tone }: { label: string; value: string; tone?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-semibold tabular-nums', tone && 'text-signal')}>{value}</dd>
    </div>
  );
}

/* T-099.1: the lot page's join surface. A guest gets the sign-in and sign-up
   paths; a signed-in customer gets the fee, their balance, and a Dialog on a
   desktop or a bottom Sheet on a phone. A balance below the fee turns the same
   dialog into the shortfall and top-up path. Since US-111 (D-070) the join is
   charged per lot, so this component acts on the lot id. */
export function JoinAuction({
  lotId,
  fee,
  returnPath,
  balance,
  mode,
  auctionEnd,
  title,
  rules,
  open: controlledOpen,
  onOpenChange
}: JoinAuctionProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<JoinFailure | null>(null);

  // AC8: "Saldo tersedia" and the header chip must show the same amount.
  useBalanceSync(balance);

  const state = joinPanelState({ mode, fee, balance });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setAcknowledged(false);
      setFailure(null);
    }
  }

  async function join() {
    setBusy(true);
    setFailure(null);
    const result = await joinLot(lotId);
    setBusy(false);

    if (result.success) {
      toast.success('Berhasil ikut lot ini.');
      // `joinLot` already re-rendered the layout and page (US-107 AC7).
      handleOpenChange(false);
      return;
    }

    const info = joinFailureInfo({
      code: result.code,
      status: result.status,
      message: result.error,
      fee
    });
    setFailure(info);
    if (info.refresh) router.refresh();
  }

  // AC12: a farmer viewing their own auction gets no join or bid controls.
  if (state === 'owner') return null;

  // The farm lookup failed for a farmer session: say so, offer nothing.
  if (state === 'unknown') {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Tidak bisa memuat status farm. Coba muat ulang.
      </p>
    );
  }

  if (state === 'guest') {
    // US-099 AC14: below `lg` the sticky footer carries this copy and both
    // guest paths, so the inline prompt would be a second sign-in button.
    return (
      <div className="hidden gap-2 lg:grid">
        <p className="text-sm text-muted-foreground">{joinGuestCopy(fee)}</p>
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            render={<Link href={signInHref(returnPath)} />}
            nativeButton={false}
            className="w-full rounded-button!"
          >
            Masuk untuk ikut lelang
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href={signUpHref(returnPath)} />}
            nativeButton={false}
            className="w-full rounded-button!"
          >
            Daftar gratis
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'joined') {
    return (
      <div className="grid gap-1 text-center">
        <Badge variant="muted" className="mx-auto">
          Sudah ikut
        </Badge>
        <p className="text-xs text-muted-foreground">Anda terdaftar sebagai peserta lot ini.</p>
      </div>
    );
  }

  const shortfall = joinShortfall(fee, balance);
  const isShort = state === 'shortfall';
  const heading = isShort ? 'Saldo belum cukup' : `Ikut lelang ${title}`;
  const description = isShort
    ? 'Top-up dulu, lalu kembali ke lot ini.'
    : 'Baca aturan sebelum biaya dipotong.';
  const closeLabel = isShort ? 'Kembali ke lot' : 'Batal';

  const headingNode = isMobile ? (
    <SheetTitle className="pe-8 text-lg font-bold">{heading}</SheetTitle>
  ) : (
    <DialogTitle className="pe-8 font-bold">{heading}</DialogTitle>
  );
  const descriptionNode = isMobile ? (
    <SheetDescription>{description}</SheetDescription>
  ) : (
    <DialogDescription>{description}</DialogDescription>
  );
  const closeButton = isMobile ? (
    <SheetClose render={<Button variant="outline" size="lg" className="w-full sm:w-auto" />}>
      {closeLabel}
    </SheetClose>
  ) : (
    <DialogClose render={<Button variant="outline" size="lg" className="w-full sm:w-auto" />}>
      {closeLabel}
    </DialogClose>
  );

  const body = (
    <div className={cn('flex flex-col gap-4', isMobile && 'p-4')}>
      <div className="flex items-start gap-4 pe-8">
        <span
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            isShort ? 'bg-warning/10 text-warning' : 'bg-accent text-accent-ink'
          )}
        >
          {isShort ? (
            <Wallet aria-hidden className="size-5" />
          ) : (
            <Ticket aria-hidden className="size-5" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          {headingNode}
          {descriptionNode}
        </div>
      </div>

      {isShort ? (
        <>
          <dl className="grid divide-y divide-primary/15 rounded-xl border border-primary/15 bg-accent px-4 text-sm [&>*]:py-2">
            <PriceRow label="Biaya ikut" value={formatPrice(fee)} />
            <PriceRow label="Saldo tersedia" value={formatPrice(balance ?? 0)} />
            <PriceRow label="Kurang" value={formatPrice(shortfall)} tone />
          </dl>
          <p className="text-sm text-muted-foreground">
            Lelang ini berakhir {formatEndTime(auctionEnd)}.
          </p>
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            {closeButton}
            <Button
              size="lg"
              render={<Link href={topupHref(shortfall, title)} />}
              nativeButton={false}
              className="w-full rounded-button! sm:w-auto"
            >
              Top-up {formatPrice(shortfall)}
            </Button>
          </div>
        </>
      ) : (
        <>
          <LotRules rules={rules} heading={false} checks />

          {fee > 0 ? (
            <dl className="grid divide-y divide-primary/15 rounded-xl border border-primary/15 bg-accent px-4 text-sm [&>*]:py-2">
              <PriceRow
                label="Biaya ikut (tidak dikembalikan jika kalah)"
                value={formatPrice(fee)}
              />
              {balance !== null ? (
                <PriceRow
                  label="Saldo setelah ikut"
                  value={formatPrice(joinBalanceAfter(fee, balance))}
                />
              ) : null}
            </dl>
          ) : null}

          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              required
            />
            <span>
              Saya paham aturan lelang ini dan biaya ikut tidak dikembalikan jika kalah.
            </span>
          </label>

          {failure ? (
            <div role="alert" className="grid gap-1 text-sm text-signal">
              <p className="font-medium">{failure.message}</p>
              {failure.topUp ? (
                <Link
                  href={topupHref(shortfall || undefined, title)}
                  className="w-fit rounded-sm font-semibold text-accent-ink underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Top-up saldo
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            {closeButton}
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={!acknowledged || busy}
              onClick={join}
            >
              {busy ? 'Memproses…' : joinConfirmLabel(fee)}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const modal = isMobile ? (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        id="lot-join-trigger-sheet"
        render={<Button size="lg" className="w-full" />}
      >
        {joinFeeLabel(fee)}
      </SheetTrigger>
      <SheetContent id="lot-join-sheet" side="bottom" className="rounded-t-[20px]!">
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
        {body}
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        id="lot-join-trigger"
        render={<Button size="lg" className="w-full" />}
      >
        {joinFeeLabel(fee)}
      </DialogTrigger>
      <DialogContent
        id="lot-join-popup"
        className="gap-5 rounded-[20px]! p-7 sm:max-w-[480px]"
      >
        {body}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <Badge variant="neutral">Belum ikut</Badge>
        {fee > 0 && balance !== null ? (
          <span className="text-sm text-muted-foreground">
            Saldo tersedia{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {formatPrice(balance)}
            </span>
          </span>
        ) : null}
      </div>
      {modal}
      {fee > 0 ? (
        <p className="text-center text-sm text-muted-foreground">{JOIN_FEE_NOTE}</p>
      ) : null}
    </div>
  );
}
