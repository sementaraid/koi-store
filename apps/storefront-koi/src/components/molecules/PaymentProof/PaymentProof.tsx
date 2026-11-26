'use client';

import { AlertTriangle, CheckCircle2, Clock, ImageUp, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { uploadPaymentProof, type WonLotPaymentProof } from '@/lib/data/lots';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import {
  MAX_SCREENSHOT_BYTES,
  formatFileSize,
  screenshotError
} from '@/lib/helpers/topup-request';

export type PaymentProofProps = {
  lotId: string;
  proof: WonLotPaymentProof;
};

// US-109 AC1–AC2 (D-077): the winner's one transfer proof. Same image rule and
// picker as the top-up screenshot (US-102 AC4), but the state comes from the
// won-lot route so the admin's decision survives a reload.
export function PaymentProof({ lotId, proof }: PaymentProofProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    if (inputRef.current) inputRef.current.value = '';
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

      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">
          {rejected ? 'Unggah bukti transfer lagi' : 'Unggah bukti transfer'}
        </p>
        <p className="text-xs text-muted-foreground">
          Foto atau tangkapan layar. JPG, PNG, atau WEBP, maksimal{' '}
          {MAX_SCREENSHOT_BYTES / (1024 * 1024)} MB.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih bukti transfer"
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-control border border-border p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local object URL, not a catalog image
            <img
              src={preview}
              alt="Pratinjau bukti transfer"
              className="size-14 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded bg-muted">
              <ImageUp aria-hidden className="size-6 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              Terpilih · {formatFileSize(file.size)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 md:min-h-8"
              onClick={() => inputRef.current?.click()}
            >
              Ganti
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-11 md:size-8"
              aria-label="Hapus bukti transfer"
              onClick={removeFile}
            >
              <X aria-hidden />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-control border border-dashed border-border bg-muted/30 p-4 text-center">
          <Upload aria-hidden className="size-6 text-muted-foreground" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 md:min-h-8"
            onClick={() => inputRef.current?.click()}
          >
            Pilih file
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs text-destructive-ink">
          {error}
        </p>
      ) : null}

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
