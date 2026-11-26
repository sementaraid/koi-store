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
  // US-099 AC13: the quick amount the phone bar picked. When set, the sheet
  // opens on the confirmation step; null means the pencil asked for the typed
  // input instead.
  openAmount?: number | null;
  // "Saldo tersedia" under the highest chip (AC15). Balance pays platform fees
  // only, so a bid never changes it (D-058, D-068).
  balance?: number | null;
  // The amount the server accepted (null when cleared), so the page derives
  // the same standing for the mobile bar from the same poll.
  onAcceptedChange?: (amount: number | null) => void;
  // US-100 AC3: no fresh poll. Every bid control waits until the connection
  // is back, so nobody bids on a price that may be stale.
  disconnected?: boolean;
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
  openAmount,
  balance,
  disconnected = false,
  onAcceptedChange
}: PlaceBidProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [innerOpen, setInnerOpen] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState<number | null>(null);
  // AC13: the amount picked in the sheet's typed-input step, after the pencil.
  const [mobileConfirm, setMobileConfirm] = useState<number | null>(null);
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
        Bid dibuka saat lelang dimulai.
      </p>
    );
  }

  const typedAmount = parseBidInput(typed);
  const chosen = typed !== '' ? typedAmount : (selected ?? baseMinimum);
  const amount = chosen !== null && chosen >= 1 ? chosen : null;
  const pending = pendingAmount !== null;
  const options = bidAmountOptions(baseMinimum, step);
  const chipActive = (option: number) =>
    typed === '' && (selected === option || (selected === null && option === baseMinimum));
  // The phone bar sends the amount it picked; the pencil sends null and the
  // sheet opens on the typed input instead (AC13).
  const mobileConfirmAmount = mobileConfirm ?? openAmount ?? null;
  const mobileTypedAmount =
    typed !== '' && typedAmount !== null ? typedAmount : baseMinimum;

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
    setMobileConfirm(null);
    setFailure(null);
  }

  function onSheetChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmAmount(null);
      setMobileConfirm(null);
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

  function renderConfirm(mobile: boolean, shownAmount: number) {
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

        {/* AC15 / D-068: what the winner pays is a labelled row, not a
            sentence, and it names the company account. */}
        <dl className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Jika menang, Anda transfer</dt>
          <dd className="text-right font-semibold tabular-nums">
            {formatPrice(shownAmount, currency)}{" "}
            <span className="block text-xs font-normal text-muted-foreground">
              ke rekening Koi Auction House dalam 1×24 jam.
            </span>
          </dd>
        </dl>

        <p className="text-sm text-muted-foreground">
          Bid tidak bisa dibatalkan setelah dipasang.
        </p>

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
              onClick={closeSheet}
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
            disabled={pending || disconnected}
            onClick={() => {
              // AC15: on desktop the dialog closes and the panel behind it
              // shows the pending state; on the phone the sheet stays and
              // shows it inline.
              if (!mobile) setConfirmAmount(null);
              void submit(shownAmount);
            }}
          >
            {pending
              ? 'Mengirim bid…'
              : disconnected
                ? 'Menunggu koneksi…'
                : bidActionLabel(shownAmount, currency)}
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
    : disconnected
      ? 'Menunggu koneksi…'
      : amount === null
        ? 'Pasang Bid'
        : bidActionLabel(amount, currency)

  const chipsField = (
    <div role="group" aria-label="Pilih nominal bid" className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={chipActive(option) ? 'solid' : 'outline'}
          className="h-11 min-w-0 px-1 tabular-nums"
          disabled={pending || disconnected}
          aria-pressed={chipActive(option)}
          aria-label={`Bid ${formatPrice(option, currency)}`}
          onClick={() => choose(option)}
        >
          {formatBidAmount(option)}
        </Button>
      ))}
    </div>
  )

  /* The desktop input and the phone sheet's input can both be in the DOM at
     once (the desktop controls are hidden with CSS, not unmounted), so each
     gets its own literal id instead of a generated one that can differ between
     the streamed server tree and the hydrated client. */
  const typedField = (id: string) => (
    <FormField
      id={id}
      name="amount"
      label={bidInputLabel(baseMinimum, currency)}
      inputMode="numeric"
      autoComplete="off"
      placeholder={formatBidAmount(baseMinimum)}
      value={typed}
      disabled={pending || disconnected}
      onChange={(event) => onTyped(event.target.value)}
      onFocus={keepInputVisible}
    />
  )

  const failureLine = failure ? (
    <p role="alert" className="text-sm text-signal">
      {failure.message}
    </p>
  ) : null

  const bidFields = (id: string) => (
    <>
      {chipsField}
      {typedField(id)}
      {failureLine}
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
        <div className="flex flex-col items-center gap-1" role="status">
          <Badge variant="success" icon={<CircleCheck aria-hidden />}>
            Anda tertinggi
          </Badge>
          {/* AC15: the balance sits under the highest chip. A bid never moves
              it; saldo pays platform fees only (D-058, D-068). */}
          {balance !== null && balance !== undefined ? (
            <p className="text-xs text-muted-foreground">
              Saldo tersedia{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatPrice(balance, currency)}
              </span>
            </p>
          ) : null}
        </div>
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
            {bidFields('lot-bid-amount')}
            {!isMobile ? (
              <Dialog
                open={confirmAmount !== null}
                onOpenChange={(next) => setConfirmAmount(next ? amount : null)}
              >
                <DialogTrigger
                  id="lot-bid-trigger"
                  render={
                    <Button
                      size="lg"
                      className="min-h-11 w-full"
                      disabled={amount === null || pending || disconnected}
                    />
                  }
                >
                  {submitLabel}
                </DialogTrigger>
                <DialogContent id="lot-bid-popup">
                  {confirmAmount !== null ? renderConfirm(false, confirmAmount) : null}
                </DialogContent>
              </Dialog>
            ) : null}
          </div>

          {isMobile ? (
            <Sheet open={open} onOpenChange={onSheetChange}>
              <SheetContent id="lot-bid-sheet" side="bottom" className="gap-0">
                {mobileConfirmAmount !== null ? (
                  <div className="p-4">{renderConfirm(true, mobileConfirmAmount)}</div>
                ) : (
                  /* AC13: the bar's chips and button go straight to the
                     confirmation; the pencil opens this typed input. */
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-1 pe-8">
                      <SheetTitle>Ketik nominal bid</SheetTitle>
                      <SheetDescription>
                        {lotLabel}
                        {farm ? ` · ${farm}` : ''}
                      </SheetDescription>
                    </div>
                    {pendingLine}
                    {typedField('lot-bid-amount-sheet')}
                    {failureLine}
                    <Button
                      size="lg"
                      className="min-h-11 w-full"
                      disabled={pending || disconnected}
                      onClick={() => setMobileConfirm(mobileTypedAmount)}
                    >
                      {disconnected
                        ? 'Menunggu koneksi…'
                        : bidActionLabel(mobileTypedAmount, currency)}
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
