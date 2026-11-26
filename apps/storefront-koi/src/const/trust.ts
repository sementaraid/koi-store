
export const TRUST_CLAIMS = {
  // D-068: the winner pays the company account; nothing is held for the buyer
  // and the farmer is paid by an admin. State only where the money goes.
  escrow: {
    title: "Bayar ke Koi Auction House.",
    body: "Dana masuk ke rekening perusahaan, bukan ke farm.",
  },
  liveGuarantee: {
    title: "Garansi tiba hidup.",
    body: "Klaim maksimal 4 jam setelah diterima.",
  },
  breeder: {
    title: "Breeder terverifikasi.",
    body: "Identitas & farm dicek tim kami.",
  },
  settled: {
    title: "Pembayaran langsung.",
    body: "Ikan dikirim setelah pembayaran dikonfirmasi.",
  },
  doa: {
    title: "Garansi tiba hidup, klaim 4 jam.",
    body: "Berlaku dengan video unboxing.",
  },
} as const
