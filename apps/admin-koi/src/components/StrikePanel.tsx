'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Label } from '@koi/ui';
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

export type StrikeTarget = Pick<GiveStrikeInput, 'lot_id' | 'customer_id' | 'seller_id'>;

export type StrikePanelProps = {
  defaultReasonType: StrikeReasonType;
  customerId: string | null;
  target: StrikeTarget;
};

const REASON_TYPES: StrikeReasonType[] = [
  'winner_unpaid',
  'farmer_not_shipped',
  'farmer_claim_refused'
];

const CONFIRM_COPY =
  'Strike ini tidak bisa dihapus, hanya dicabut dengan alasan. Dua strike aktif memblokir akun.';

function banToast(prefix: string, ban: { active_count: number; banned: boolean }): string {
  return `${prefix} ${activeStrikeLabel(ban.active_count)} — ${banLabel(ban.banned).toLowerCase()}.`;
}

export function StrikePanel({ defaultReasonType, customerId, target }: StrikePanelProps) {
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reasonType, setReasonType] = useState<StrikeReasonType>(defaultReasonType);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<StrikeHistory | null | 'loading'>(null);

  async function loadHistory() {
    if (!customerId) return;
    setHistory('loading');
    setHistory(await listStrikes(customerId));
  }

  async function openPanel() {
    setReasonType(defaultReasonType);
    setOpen(true);
    if (history === null) await loadHistory();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = strikeReasonError(reason);
    if (message) {
      setError(message);
      return;
    }
    if (!confirm(CONFIRM_COPY)) return;

    setBusy(true);
    setError(null);
    const result = await giveStrike({ ...target, reason_type: reasonType, reason });
    setBusy(false);

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setError(info.message);
      toast.error(info.message);
      if (info.refresh) router.refresh();
      return;
    }

    toast.success(banToast('Strike diberikan.', result.ban));
    setReason('');
    setHistory(null);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="grid gap-3 border-t border-border pt-3">
      {!open ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPanel}
          >
            Beri strike
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-2" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-type`}>Jenis strike</Label>
            <select
              id={`${id}-type`}
              value={reasonType}
              onChange={(event) => setReasonType(event.target.value as StrikeReasonType)}
              className="h-12 w-full max-w-sm rounded-control border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 md:h-10 dark:bg-input/30"
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
            <textarea
              id={`${id}-reason`}
              rows={3}
              maxLength={STRIKE_REASON_MAX}
              value={reason}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive-ink">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tersimpan bersama strike ini. Maksimal {STRIKE_REASON_MAX} karakter.
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">{CONFIRM_COPY}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="destructive" size="sm" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Beri strike'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
          </div>
        </form>
      )}

      {open && customerId ? (
        <StrikeHistoryList
          history={history}
          onChanged={() => {
            void loadHistory();
            router.refresh();
          }}
        />
      ) : null}
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
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const active = strike.removed_at === null;

  async function remove(event: React.FormEvent) {
    event.preventDefault();
    const message = strikeReasonError(reason, 'Masukkan alasan pencabutan');
    if (message) {
      setError(message);
      return;
    }
    if (!confirm('Cabut strike ini? Riwayatnya tetap tersimpan.')) return;

    setBusy(true);
    setError(null);
    const result = await removeStrike(strike.id, reason);
    setBusy(false);

    if (!result.success) {
      const info = strikeFailureInfo(result.status, result.error);
      setError(info.message);
      toast.error(info.message);
      if (info.refresh) onChanged();
      return;
    }

    toast.success(banToast('Strike dicabut.', result.ban));
    setReason('');
    setOpen(false);
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
        open ? (
          <form onSubmit={remove} className="grid gap-1.5" noValidate>
            <Label htmlFor={`${id}-reason`}>Alasan pencabutan</Label>
            <textarea
              id={`${id}-reason`}
              rows={2}
              maxLength={STRIKE_REASON_MAX}
              value={reason}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              className="w-full min-w-0 resize-y rounded-control border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-info focus-visible:ring-3 focus-visible:ring-info/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
            />
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-destructive-ink">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="destructive" size="xs" disabled={busy}>
                {busy ? 'Mencabut…' : 'Cabut strike'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
              Cabut strike
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}
