/** Indonesian copy for the backend's 400s on a wallet adjustment (US-013 fix
    round 1). Detected by a stable substring of the backend's message, since
    there's no error code yet. Everything else passes through verbatim, per
    the admin app's rule that backend errors are shown as-is. */
const KNOWN_400: { match: string; message: string }[] = [
  { match: 'has no wallet yet', message: 'Pelanggan belum punya saldo — profil belum lengkap.' },
  { match: 'negative', message: 'Koreksi ditolak: saldo tidak boleh kurang dari Rp0.' }
];

/** Maps a 400 wallet-adjustment error to Indonesian copy when recognized,
    otherwise returns the original message unchanged. `status` undefined or
    not 400 always passes through. */
export function walletAdjustmentErrorMessage(message: string, status: number | undefined): string {
  if (status !== 400) return message;
  return KNOWN_400.find((k) => message.includes(k.match))?.message ?? message;
}
