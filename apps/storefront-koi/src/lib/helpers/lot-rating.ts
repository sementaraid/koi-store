/* US-057 T-057.2 (AC1): the winner rates the farmer once, from `shipped` on.
   Pure decisions here so the row's states are tested without a browser. The
   server owns every rule (once per lot, status gate, ownership); this only
   mirrors it for display. */

/** The four fields `GET /store/won-lots` returns for a saved rating. Never
    the rater's customer id (D-042/D-045). */
export type LotRating = {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
};

/** Statuses a rating may still be written on (`mvp-Q48` default: shipped or
    later). `won`/`paid` are deliberately absent — the fish has not arrived. */
const RATEABLE_STATUSES = ['shipped', 'delivered', 'claimed'] as const;

/** Whether this row offers "Nilai kebun": shipped-or-later and not yet rated. */
export function canRateLot(input: { status: string; rating: LotRating | null }): {
  show: boolean;
} {
  return {
    show:
      !input.rating &&
      (RATEABLE_STATUSES as readonly string[]).includes(input.status)
  };
}

export type RatingFailure = {
  /** What the winner reads under the control. */
  message: string;
  /** Whether the row is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused rating. Medusa rewrites every 409 body to
    `invalid_state_error` (D-055), so the status is the only reliable signal:
    both refusal reasons in flow mean the row is stale and must be re-read. */
export function ratingFailureInfo(input: {
  status?: number;
  message: string;
}): RatingFailure {
  if (input.status === 404) {
    return { message: 'Lot ini tidak ditemukan.', refresh: true };
  }
  if (input.status === 409) {
    return { message: 'Status lot sudah berubah. Halaman diperbarui.', refresh: true };
  }
  return {
    message: input.message || 'Gagal mengirim penilaian. Coba lagi.',
    refresh: false
  };
}
