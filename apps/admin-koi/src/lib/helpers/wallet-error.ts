const KNOWN_400: { match: string; message: string }[] = [
  { match: 'has no wallet yet', message: 'Pelanggan belum punya saldo — profil belum lengkap.' },
  { match: 'negative', message: 'Koreksi ditolak: saldo tidak boleh kurang dari Rp0.' }
];

export function walletAdjustmentErrorMessage(message: string, status: number | undefined): string {
  if (status !== 400) return message;
  return KNOWN_400.find((k) => message.includes(k.match))?.message ?? message;
}
