'use client';

import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FocusEvent } from 'react';

import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  FormField
} from '@koi/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle
} from '@koi/ui/primitives/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { placeBid } from '@/lib/data/lots';
import { formatPrice } from '@/lib/helpers/format-price';
import {
  acceptedNotice,
  bidStanding,
  outbidNotice,
  type BidStanding
} from '@/lib/helpers/bid-status';
import {
  bidActionLabel,
  bidAmountOptions,
  bidFailureInfo,
  bidInputLabel,
  BID_NETWORK_FAILURE,
  formatBidAmount,
  formatBidInput,
  parseBidInput,
  runGuarded,
  type AcceptedBid,
  type BidControlState,
  type BidFailure
} from '@/lib/helpers/place-bid';

type PlaceBidProps = {
  lotId: string;
  mode: BidControlState;
  minimum: number;
  step: number;
  lotLabel: string;
  title: string;
  farm?: string;
  currency?: string;
  // The viewer's standing, derived once by the lot page from the latest poll
  // and the accepted amount (bidStanding).
  standing?: BidStanding;
  /* US-099 AC11: the mobile bar opens this panel in a bottom Sheet. The state
     stays in this one instance, so the accepted/outbid UI is never duplicated. */
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  // The amount the server accepted (null when cleared), so the page derives
  // the same standing for the mobile bar from the same poll.
  onAcceptedChange?: (amount: number | null) => void;
};

/* US-099 AC4–AC9: the joined customer's bid controls and their status. Three
   quick amounts and a typed, separator-formatted amount feed one confirmation
   Dialog (desktop) or the same bottom Sheet's confirm step (phone). The server
   stays the judge of the minimum and the step (D-023); the browser only refuses
   an empty or zero amount. While the viewer is highest the controls give way to
   an "Anda tertinggi" chip; an outbid poll brings them back with a new minimum. */
export function PlaceBid({
  lotId,
  mode,
  minimum,
  step,
  lotLabel,
  title,
  farm,
  currency,
  standing: shownStanding,
  sheetOpen,
  onSheetOpenChange,
  onAcceptedChange
}: PlaceBidProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [innerOpen, setInnerOpen] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [failure, setFailure] = useState<BidFailure | null>(null);
  const [accepted, setAccepted] = useState<AcceptedBid | null>(null);
  const submitting = useRef(false);

  const open = sheetOpen ?? innerOpen;
  const setOpen = onSheetOpenChange ?? setInnerOpen;

  // A 201 moves the minimum on before the poll answers.
  const acceptedMinimum =
    accepted?.currentPrice != null ? accepted.currentPrice + Math.max(step, 0) : null;
  const baseMinimum = Math.max(minimum, acceptedMinimum ?? 0);
  const standing =
    shownStanding ?? bidStanding({ acceptedAmount: accepted?.amount });
  const highest = standing === 'highest';

  if (mode === 'waiting') {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Bidding dibuka saat lelang dimulai.
      </p>
    );
  }

  const typedAmount = parseBidInput(typed);
  const chosen = typed !== '' ? typedAmount : (selected ?? baseMinimum);
  const amount = chosen !== null && chosen >= 1 ? chosen : null;
  const pending = pendingAmount !== null;
  const options = bidAmountOptions(baseMinimum, step);
  const shownAmount = confirmAmount ?? amount;
  const chipActive = (option: number) =>
    typed === '' && (selected === option || (selected === null && option === baseMinimum));

  function choose(option: number) {
    setSelected(option);
    setTyped('');
    setFailure(null);
  }

  function onTyped(raw: string) {
    setTyped(formatBidInput(raw));
    setFailure(null);
  }

  function closeSheet() {
    setOpen(false);
    setConfirmAmount(null);
    setFailure(null);
  }

  function onSheetChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmAmount(null);
      setFailure(null);
    }
  }

  // AC11: the phone keyboard shrinks the viewport under a fixed sheet. Bring
  // the focused amount input back into the visible area once the keyboard has
  // finished opening. Only below the tablet breakpoint, so desktop never jumps.
  function keepInputVisible(event: FocusEvent<HTMLInputElement>) {
    if (window.innerWidth >= 768) return;
    const input = event.currentTarget;
    window.setTimeout(() => {
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);
  }

  async function submit(value: number) {
    const run = await runGuarded(submitting, async () => {
      setPendingAmount(value);
      setFailure(null);
      setAccepted(null);
      onAcceptedChange?.(null);
      return placeBid(lotId, value);
    });
    if (run.status === 'busy') return;
    setPendingAmount(null);

    // A thrown request never reached a verdict: no "Anda tertinggi", the chosen
    // amount stays, the controls come back.
    if (run.status === 'threw') {
      setFailure(BID_NETWORK_FAILURE);
      setConfirmAmount(null);
      return;
    }
    const result = run.value;

    if (result.success) {
      setAccepted({
        amount: value,
        currentPrice: result.current_price ?? null,
        endTime: result.end_time ?? null
      });
      onAcceptedChange?.(value);
      // Follow the new minimum rather than the amount just sent.
      setSelected(null);
      setTyped('');
      setConfirmAmount(null);
      closeSheet();
      router.refresh();
      return;
    }

    const info = bidFailureInfo({
      code: result.code,
      status: result.status,
      message: result.error
    });
    setFailure(info);
    setConfirmAmount(null);
    if (info.refresh) router.refresh();
  }

  function renderConfirm(mobile: boolean) {
    if (shownAmount === null) return null

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 pe-8">
          {mobile ? (
            <SheetTitle>Konfirmasi bid</SheetTitle>
          ) : (
            <DialogTitle>Konfirmasi bid</DialogTitle>
          )}
          {mobile ? (
            <SheetDescription>Periksa nominal sebelum bid dipasang.</SheetDescription>
          ) : (
            <DialogDescription>Periksa nominal sebelum bid dipasang.</DialogDescription>
          )}
        </div>

        <div className="flex flex-col gap-0.5 rounded-control border border-border bg-surface p-3">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">
            {lotLabel}
            {farm ? ` · ${farm}` : ''}
          </p>
        </div>

        <dl className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Nominal bid</dt>
          <dd className="text-base font-semibold tabular-nums">
            {formatPrice(shownAmount, currency)}
          </dd>
        </dl>

        <div className="grid gap-1 text-sm text-muted-foreground">
          <p>Bid tidak bisa dibatalkan setelah dipasang.</p>
          <p>
            Jika menang, Anda bayar {formatPrice(shownAmount, currency)} langsung ke farm dalam
            1×24 jam.
          </p>
        </div>

        {/* The desktop line sits above the panel; the sheet's confirm step has
            no panel behind it, so it shows its own. */}
        {mobile ? pendingLine : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {mobile ? (
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              disabled={pending}
              onClick={() => setConfirmAmount(null)}
            >
              Batal
            </Button>
          ) : (
            <DialogClose
              disabled={pending}
              render={
                <Button variant="outline" size="lg" className="min-h-11 w-full sm:w-auto" />
              }
            >
              Batal
            </DialogClose>
          )}
          <Button
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            disabled={pending}
            onClick={() => void submit(shownAmount)}
          >
            {pending ? 'Mengirim bid…' : bidActionLabel(shownAmount, currency)}
          </Button>
        </div>
      </div>
    )
  }

  const pendingLine = pendingAmount !== null ? (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm font-semibold"
    >
      <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
      Mengirim bid {formatPrice(pendingAmount, currency)}…
    </p>
  ) : null;

  const submitLabel = pending
    ? 'Mengirim bid…'
    : amount === null
      ? 'Pasang Bid'
      : bidActionLabel(amount, currency)

  const bidFields = (
    <>
      <div role="group" aria-label="Pilih nominal bid" className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            variant={chipActive(option) ? 'solid' : 'outline'}
            className="h-11 min-w-0 px-1 tabular-nums"
            disabled={pending}
            aria-pressed={chipActive(option)}
            aria-label={`Bid ${formatPrice(option, currency)}`}
            onClick={() => choose(option)}
          >
            {formatBidAmount(option)}
          </Button>
        ))}
      </div>

      <FormField
        name="amount"
        label={bidInputLabel(baseMinimum, currency)}
        inputMode="numeric"
        autoComplete="off"
        placeholder={formatBidAmount(baseMinimum)}
        value={typed}
        disabled={pending}
        onChange={(event) => onTyped(event.target.value)}
        onFocus={keepInputVisible}
      />

      {failure ? (
        <p role="alert" className="text-sm text-signal">
          {failure.message}
        </p>
      ) : null}
    </>
  )

  const acceptedView = accepted ? acceptedNotice(accepted.amount, currency) : null;
  const outbidView = outbidNotice(baseMinimum, currency);

  return (
    <div className="grid gap-3" data-slot="place-bid">
      {!isMobile ? pendingLine : null}

      {/* AC7: the server's 201, announced. It stays only while the viewer is
          still highest; an outbid poll replaces it with AC8's message. */}
      {highest && acceptedView ? (
        <Alert
          tone="success"
          role="status"
          icon={<CircleCheck aria-hidden />}
          title={acceptedView.title}
        >
          {acceptedView.text}
        </Alert>
      ) : null}

      {highest ? (
        <Badge variant="success" icon={<CircleCheck aria-hidden />}>
          Anda tertinggi
        </Badge>
      ) : (
        <>
          {standing === 'outbid' ? (
            <Alert
              tone="signal"
              icon={<TriangleAlert aria-hidden />}
              title={outbidView.title}
            >
              {outbidView.text}
            </Alert>
          ) : null}

          {/* The desktop controls are hidden below `lg` from the first paint,
              so a phone never sees them flash before `isMobile` settles. */}
          <div className="hidden gap-3 lg:grid">
            {bidFields}
            {!isMobile ? (
              <Dialog
                open={confirmAmount !== null}
                onOpenChange={(next) => setConfirmAmount(next ? amount : null)}
              >
                <DialogTrigger
                  render={
                    <Button
                      size="lg"
                      className="min-h-11 w-full"
                      disabled={amount === null || pending}
                    />
                  }
                >
                  {submitLabel}
                </DialogTrigger>
                <DialogContent>{renderConfirm(false)}</DialogContent>
              </Dialog>
            ) : null}
          </div>

          {isMobile ? (
            <Sheet open={open} onOpenChange={onSheetChange}>
              <SheetContent side="bottom" className="gap-0">
                {confirmAmount !== null ? (
                  <div className="p-4">{renderConfirm(true)}</div>
                ) : (
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-1 pe-8">
                      <SheetTitle>Pasang bid</SheetTitle>
                      <SheetDescription>
                        {lotLabel}
                        {farm ? ` · ${farm}` : ''}
                      </SheetDescription>
                    </div>
                    {pendingLine}
                    {bidFields}
                    <Button
                      size="lg"
                      className="min-h-11 w-full"
                      disabled={amount === null || pending}
                      onClick={() => setConfirmAmount(amount)}
                    >
                      {submitLabel}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          ) : null}
        </>
      )}
    </div>
  );
}
