
export type LotRating = {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
};

const RATEABLE_STATUSES = ['shipped', 'delivered', 'claimed'] as const;

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
  message: string;
  refresh: boolean;
};

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
