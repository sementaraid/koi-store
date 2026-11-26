'use client';

import { AlertTriangle, CheckCircle2, Clock, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { FileField } from '@/components/molecules/FileField/FileField';
import { uploadPaymentProof, type WonLotPaymentProof } from '@/lib/data/lots';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { MAX_SCREENSHOT_BYTES, screenshotError } from '@/lib/helpers/topup-request';

export type PaymentProofProps = {
  lotId: string;
  proof: WonLotPaymentProof;
};

// US-109 AC1–AC2 (D-077): the winner's one transfer proof. Same image rule and
// picker as the top-up screenshot (US-102 AC4), but the state comes from the
// won-lot route so the admin's decision survives a reload.
export function PaymentProof({ lotId, proof }: PaymentProofProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;

    const message = screenshotError(candidate);
    if (message) {
      setError(message);
      return;
    }

    setError(null);
    setFile(candidate);
  }

  function removeFile() {
    setFile(null);
    setError(null);
  }

  async function submit() {
    if (!file) {
      setError('Unggah bukti transfer dulu.');
      return;
    }

    const message = screenshotError(file);
    if (message) {
      setError(message);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await uploadPaymentProof(lotId, file);
    setBusy(false);

    if (result.success) {
      setFile(null);
      toast.success('Bukti transfer terkirim.');
      router.refresh();
      return;
    }

    setError(result.message);
    toast.error(result.message);
  }

  if (proof.status === 'confirmed') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-success">
        <CheckCircle2 aria-hidden className="size-4 shrink-0" />
        Bukti diterima
      </p>
    );
  }

  if (proof.status === 'pending') {
    return (
      <div
        role="status"
        className="grid gap-0.5 rounded-md border border-border bg-background px-3 py-2"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Clock aria-hidden className="size-4 shrink-0" />
          Menunggu dicek admin
        </p>
        {proof.uploaded_at ? (
          <p className="text-xs text-muted-foreground">
            Diunggah {formatDeadline(proof.uploaded_at)} WIB
          </p>
        ) : null}
      </div>
    );
  }

  const rejected = proof.status === 'rejected';

  return (
    <div className="grid gap-3">
      {rejected ? (
        <div
          role="alert"
          className="rounded-md border border-destructive-ink/30 bg-destructive/5 px-3 py-2"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive-ink">
            <AlertTriangle aria-hidden className="size-4 shrink-0" />
            Bukti ditolak
          </p>
          {proof.reason ? (
            <p className="mt-0.5 text-sm break-words text-foreground">{proof.reason}</p>
          ) : null}
        </div>
      ) : null}

      <FileField
        id="payment-proof"
        label={rejected ? 'Unggah bukti transfer lagi' : 'Unggah bukti transfer'}
        hint={
          <>
            Foto atau tangkapan layar. JPG, PNG, atau WEBP, maksimal{' '}
            {MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.
          </>
        }
        accept="image/jpeg,image/png,image/webp"
        files={file ? [file] : []}
        onChoose={files => acceptFile(files[0])}
        onRemove={removeFile}
        error={error ?? undefined}
      />

      {file ? (
        <Button
          type="button"
          size="md"
          className="w-full sm:w-auto"
          onClick={submit}
          disabled={busy}
        >
          <Upload aria-hidden />
          {busy ? 'Mengirim…' : 'Kirim bukti transfer'}
        </Button>
      ) : null}
    </div>
  );
}
