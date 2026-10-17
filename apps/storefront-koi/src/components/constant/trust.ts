/* What the house promises about the money, and where a bidder checks it. Copy
   only — the lines are drawn by `module/lot-dossier.tsx`.

   Held once because both surfaces answer the same question, and the one line
   they must never word differently is the one about whose money is being held:
   "Garansi hidup 24 jam" said two ways on two pages is a house contradicting
   itself about its own guarantee. */

/** The escrow claim. A lot's page says what it is in a line; the room, which is
    where the money actually moves, says it in full and links the regulation. */
export const TRUST_CLAIMS = {
  escrow: {
    title: "Rekber aman.",
    body: "Dana ditahan sampai koi diterima.",
  },
  escrowLive: {
    title: "Rekber otomatis.",
    body: "Dana pemenang ditahan di rekening bersama sampai koi diterima hidup, sehat, dan sesuai video kurasi lelang. D.O.A diganti 100% penuh.",
  },
  liveGuarantee: {
    title: "Garansi hidup 24 jam.",
    body: "Berlaku dengan video unboxing.",
  },
  breeder: {
    title: "Breeder terverifikasi.",
    body: "Identitas & farm dicek tim kami.",
  },
  /** The cart's own two, about settling rather than about the fish: what the
      payment unlocks and what happens to a fish that arrives dead. Written here
      rather than reusing
      {@link liveGuarantee}, which is a lot's promise to a bidder — a cart is
      settling a bill, and the same fact is worded for the reader in front of
      it. */
  settled: {
    title: "Pembayaran langsung.",
    body: "Ikan dikirim setelah pembayaran dikonfirmasi.",
  },
  doa: {
    title: "Garansi D.O.A 100%.",
    body: "Dengan video unboxing 24 jam.",
  },
} as const
