'use client';

import { CheckCircle2, ImageUp, Upload, Video, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { uploadArrivalProof, type WonLotArrivalProof } from '@/lib/data/lots';
import {
  ARRIVAL_PROOF_IMAGE_MAX_BYTES,
  ARRIVAL_PROOF_VIDEO_MAX_BYTES,
  arrivalProofError
} from '@/lib/helpers/arrival-proof';
import { formatDeadline } from '@/lib/helpers/format-deadline';
import { formatFileSize } from '@/lib/helpers/topup-request';

export type ArrivalProofProps = {
  lotId: string;
  proof: WonLotArrivalProof;
};

// US-110 AC2 (D-074): the winner's one photo or video showing the koi arrived
// healthy. Same picker and preview as the transfer proof (US-109), but a video
// is allowed at the claim video's size. The upload never marks the lot
// delivered and never ends the claim right; the payout follows only after the
// 4-hour claim window passes with no claim.
export function ArrivalProof({ lotId, proof }: ArrivalProofProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;

    const message = arrivalProofError(candidate);
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
      setError('Unggah bukti kondisi koi dulu.');
      return;
    }

    const message = arrivalProofError(file);
    if (message) {
      setError(message);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await uploadArrivalProof(lotId, file);
    setBusy(false);

    if (result.success) {
      setFile(null);
      toast.success('Bukti kondisi koi terkirim.');
      router.refresh();
      return;
    }

    setError(result.message);
    toast.error(result.message);
  }

  if (proof.has_file) {
    return (
      <div className="grid gap-1">
        <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 aria-hidden className="size-4 shrink-0" />
          Bukti diterima
          {proof.uploaded_at ? ` ${formatDeadline(proof.uploaded_at)} WIB` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Dana ke peternak cair setelah masa klaim 4 jam berakhir tanpa klaim.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground">Unggah bukti koi diterima</p>
        <p className="text-xs text-muted-foreground">
          Foto JPG, PNG, atau WEBP maksimal {ARRIVAL_PROOF_IMAGE_MAX_BYTES / (1024 * 1024)} MB,
          atau video MP4, WebM, QuickTime maksimal{' '}
          {ARRIVAL_PROOF_VIDEO_MAX_BYTES / (1024 * 1024)} MB.
        </p>
        <p className="text-xs text-muted-foreground">
          Mengunggah bukti ini tidak menandai lot diterima dan tidak menghapus hak klaim.
          Dana ke peternak cair setelah masa klaim 4 jam berakhir tanpa klaim.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        className="sr-only"
        tabIndex={-1}
        aria-label="Pilih bukti kondisi koi"
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
              alt="Pratinjau bukti kondisi koi"
              className="size-14 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded bg-muted">
              {file.type.startsWith('video/') ? (
                <Video aria-hidden className="size-6 text-muted-foreground" />
              ) : (
                <ImageUp aria-hidden className="size-6 text-muted-foreground" />
              )}
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
              aria-label="Hapus bukti kondisi koi"
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
          {busy ? 'Mengirim…' : 'Kirim bukti kondisi koi'}
        </Button>
      ) : null}
    </div>
  );
}
