'use client';

import { CheckCircle2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@koi/ui';
import { FileField } from '@/components/molecules/FileField/FileField';
import { uploadArrivalProof, type WonLotArrivalProof } from '@/lib/data/lots';
import {
  ARRIVAL_PROOF_IMAGE_MAX_BYTES,
  ARRIVAL_PROOF_VIDEO_MAX_BYTES,
  arrivalProofError
} from '@/lib/helpers/arrival-proof';
import { formatDeadline } from '@/lib/helpers/format-deadline';

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      <FileField
        id="arrival-proof"
        label="Unggah bukti koi diterima"
        hint={
          <>
            Foto JPG, PNG, atau WEBP maksimal {ARRIVAL_PROOF_IMAGE_MAX_BYTES / (1024 * 1024)} MB,
            atau video MP4, WebM, QuickTime maksimal{' '}
            {ARRIVAL_PROOF_VIDEO_MAX_BYTES / (1024 * 1024)} MB.
          </>
        }
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        files={file ? [file] : []}
        onChoose={files => acceptFile(files[0])}
        onRemove={removeFile}
        error={error ?? undefined}
      />

      <p className="text-xs text-muted-foreground">
        Mengunggah bukti ini tidak menandai lot diterima dan tidak menghapus hak klaim.
        Dana ke peternak cair setelah masa klaim 4 jam berakhir tanpa klaim.
      </p>

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
