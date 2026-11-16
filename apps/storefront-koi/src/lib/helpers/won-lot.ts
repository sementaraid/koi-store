/* US-053 T-053.2 (AC1): the winner's own view of a won lot on its public page.
   The public `GET /store/lots/:id` hides the winner (D-046), so the page asks
   the authenticated `GET /store/won-lots/:id` instead; only the winner gets a
   row back. Pure decisions here, so the states can be tested without a browser. */

/** The one action a won lot offers: `shipped → delivered` (AC1). */
export function wonLotAction(status: string): 'deliver' | null {
  return status === 'shipped' ? 'deliver' : null;
}

/** The winner's own status line for a won lot. `null` means the status is
    outside won-and-later, which the authenticated route never returns. */
export function wonLotStatusLabel(status: string): string | null {
  switch (status) {
    case 'won':
      // Payment is not built in this release (T-052.4 parked): say only this.
      return 'Menunggu pembayaran';
    case 'paid':
      return 'Sudah dibayar — menunggu dikirim petani';
    case 'shipped':
      return 'Sedang dikirim';
    case 'delivered':
      return 'Sudah diterima';
    case 'claimed':
      return 'Klaim diajukan';
    default:
      return null;
  }
}

export type DeliverFailure = {
  /** What the winner reads under the control. */
  message: string;
  /** Whether the lot is stale and must be re-read from the server. */
  refresh: boolean;
};

/** Read one refused "mark delivered". Medusa rewrites a 409 body, so the
    status is the reliable signal there. */
export function deliverFailureInfo(input: {
  code?: string;
  status?: number;
  message: string;
}): DeliverFailure {
  if (input.status === 409) {
    return {
      message: 'Status lot sudah berubah. Halaman diperbarui — periksa lagi.',
      refresh: true
    };
  }
  if (input.status === 404) {
    return { message: 'Lot ini bukan lot yang Anda menangkan.', refresh: true };
  }
  return { message: input.message || 'Gagal menandai lot diterima. Coba lagi.', refresh: false };
}
