'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea
} from '@koi/ui';
import {
  giveStrike,
  listStrikes,
  removeStrike,
  type GiveStrikeInput,
  type StrikeHistory,
  type StrikeReasonType
} from '@/lib/data/strikes';
import {
  activeStrikeLabel,
  banLabel,
  formatStrikeDate,
  reasonTypeLabel,
  STRIKE_REASON_MAX,
  strikeFailureInfo,
  strikeReasonError
} from '@/lib/helpers/strike-format';

import { ConfirmDialog } from './ConfirmDialog';

export type StrikeTarget = Pick<GiveStrikeInput, 'lot_id' | 'customer_id' | 'seller_id'>;

export type StrikePanelProps = {
  defaultReasonType: StrikeReasonType;
  customerId: string | null;
  target: StrikeTarget;
  /** Stable id of this panel's mount site (row id or account id). Two panels on
      one page must not share it: their fields would share an id. */
  idPrefix: string;
  /** Who the strike lands on, for the dialog heading. */
  targetName?: string;
};

const REASON_TYPES: StrikeReasonType[] = [
  'winner_unpaid',
  'farmer_not_shipped',
  'farmer_claim_refused'
];

const CONFIRM_COPY =
  'Strike ini tidak bisa dihapus, hanya dicabut dengan alasan. Dua strike aktif memblokir akun.';

const STRIKE_REASON_SCHEMA = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(STRIKE_REASON_MAX, `Alasan maksimal ${STRIKE_REASON_MAX} karakter`)
});

type StrikeReasonData = z.infer<typeof STRIKE_REASON_SCHEMA>;

function banToast(prefix: string, ban: { active_count: number; banned: boolean }): string {
  return `${prefix} ${activeStrikeLabel(ban.active_count)} — ${banLabel(ban.banned).toLowerCase()}.`;
}

export function StrikePanel({
  defaultReasonType,
  customerId,
  target,
  idPrefix,
  targetName
}: StrikePanelProps) {
  const router = useRouter();
  /* Deterministic, not `useId`, so the server HTML and the client agree. */
  const id = `${idPrefix}-strike`;
  const [formOpen, setFormOpen] = useState(false);
  const [reasonType, setReasonType] = useState<StrikeReasonType>(defaultReasonType);
  const [pendingReason, setPendingReason] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState<StrikeHistory | null | 'loading'>(null);
  const [historyRequested, setHistoryRequested] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<StrikeReasonData>({
    resolver: zodResolver(STRIKE_REASON_SCHEMA),
    defaultValues: { reason: '' }
  });
  const fieldError = errors.reason?.message;
  const title = targetName ? `Beri strike ke ${targetName}` : 'Beri strike';

  async function loadHistory() {
    if (!customerId) return;
    setHistory('loading');
    setHistory(await listStrikes(customerId));
  }

  async function openForm() {
    setReasonType(defaultReasonType);
    setApiError(null);
    setFormOpen(true);
    if (customerId) setHistoryRequested(true);
    if (history === null) await loadHistory();
  }

  function changeFormOpen(next: boolean) {
    setFormOpen(next);
    if (!next) {
      setApiError(null);
      setPendingReason('');
      reset();
    }
  }

  function submit(data: StrikeReasonData) {
    setPendingReason(data.reason);
    setApiError(null);
    /* Hand off to the final confirmation step rather than firing the strike. */
    setFormOpen(false);
    setConfirmOpen(true);
  }

  async function confirmStrike() {
    setApiError(null);
    const result = await giveStrike({ ...target, reason_type: reasonType, reason: pendingReason });

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setApiError(info.message);
      toast.error(info.message);
      if (info.refresh) router.refresh();
      return;
    }

    toast.success(banToast('Strike diberikan.', result.ban));
    setConfirmOpen(false);
    setPendingReason('');
    reset();
    void loadHistory();
    router.refresh();
  }

  return (
    <div className="grid gap-3 border-t border-border pt-3">
      <div>
        <Button type="button" variant="outline" size="sm" onClick={openForm}>
          Beri strike
        </Button>
      </div>

      <Dialog open={formOpen} onOpenChange={changeFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(submit)} className="grid gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{CONFIRM_COPY}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-type`}>Jenis strike</Label>
              <select
                id={`${id}-type`}
                value={reasonType}
                onChange={(event) => setReasonType(event.target.value as StrikeReasonType)}
                className="h-12 w-full rounded-control border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 md:h-10 dark:bg-input/30"
              >
                {REASON_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {reasonTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-reason`}>Alasan strike</Label>
              <Textarea
                id={`${id}-reason`}
                rows={3}
                maxLength={STRIKE_REASON_MAX}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? `${id}-error` : undefined}
                {...register('reason')}
              />
              {fieldError ? (
                <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                  {fieldError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Wajib diisi, 5–{STRIKE_REASON_MAX} karakter. Tersimpan bersama strike ini.
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Batal
              </DialogClose>
              <Button type="submit" variant="destructive">
                Lanjutkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {historyRequested && customerId ? (
        <StrikeHistoryList
          history={history}
          onChanged={() => {
            void loadHistory();
            router.refresh();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setApiError(null);
        }}
        title={targetName ? `Beri strike ke ${targetName}?` : 'Beri strike?'}
        description={CONFIRM_COPY}
        confirmLabel="Beri strike"
        busyLabel="Menyimpan…"
        destructive
        error={apiError}
        onConfirm={confirmStrike}
      />
    </div>
  );
}

function StrikeHistoryList({
  history,
  onChanged
}: {
  history: StrikeHistory | null | 'loading';
  onChanged: () => void;
}) {
  if (history === 'loading') {
    return <p className="text-xs text-muted-foreground">Memuat riwayat strike…</p>;
  }
  if (history === null) {
    return (
      <p className="text-xs text-destructive-ink">
        Gagal memuat riwayat strike. Tutup dan buka lagi untuk mencoba.
      </p>
    );
  }
  if (history.strikes.length === 0) {
    return <p className="text-xs text-muted-foreground">Belum ada strike untuk akun ini.</p>;
  }

  return (
    <div className="grid gap-2">
      <p className="text-xs font-medium text-muted-foreground">Riwayat strike</p>
      {history.strikes.map((strike) => (
        <StrikeHistoryRow key={strike.id} strike={strike} onChanged={onChanged} />
      ))}
    </div>
  );
}

function StrikeHistoryRow({
  strike,
  onChanged
}: {
  strike: StrikeHistory['strikes'][number];
  onChanged: () => void;
}) {
  /* The strike id is unique per row, so each revocation dialog has its own id. */
  const id = `strike-${strike.id}`;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const active = strike.removed_at === null;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setReason('');
      setFieldError(null);
      setApiError(null);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = strikeReasonError(reason, 'Masukkan alasan pencabutan');
    if (message) {
      setFieldError(message);
      return;
    }
    setOpen(false);
    setApiError(null);
    setConfirmOpen(true);
  }

  async function confirmRemove() {
    setApiError(null);
    const result = await removeStrike(strike.id, reason);

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setApiError(info.message);
      toast.error(info.message);
      if (info.refresh) onChanged();
      return;
    }

    toast.success(banToast('Strike dicabut.', result.ban));
    setConfirmOpen(false);
    setReason('');
    setFieldError(null);
    onChanged();
  }

  return (
    <div className="grid gap-1 rounded-control border border-border p-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{reasonTypeLabel(strike.reason_type)}</Badge>
        <Badge variant={active ? 'muted' : 'info'}>{active ? 'Aktif' : 'Dicabut'}</Badge>
        <span className="text-muted-foreground">{formatStrikeDate(strike.created_at)}</span>
      </div>
      <p>{strike.reason}</p>
      {strike.removed_reason ? (
        <p className="text-muted-foreground">Alasan pencabutan: {strike.removed_reason}</p>
      ) : null}
      {active ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              setReason('');
              setFieldError(null);
              setApiError(null);
              setOpen(true);
            }}
          >
            Cabut strike
          </Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>Cabut strike</DialogTitle>
              <DialogDescription>Riwayatnya tetap tersimpan.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-reason`}>Alasan pencabutan</Label>
              <Textarea
                id={`${id}-reason`}
                rows={2}
                maxLength={STRIKE_REASON_MAX}
                value={reason}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={fieldError ? `${id}-error` : undefined}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (fieldError) setFieldError(null);
                }}
              />
              {fieldError ? (
                <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                  {fieldError}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Batal
              </DialogClose>
              <Button type="submit" variant="destructive">
                Cabut strike
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setApiError(null);
        }}
        title="Cabut strike?"
        description="Cabut strike ini? Riwayatnya tetap tersimpan."
        confirmLabel="Cabut strike"
        busyLabel="Mencabut…"
        destructive
        error={apiError}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
