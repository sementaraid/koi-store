/* How a refused submit reads to the farmer (US-031 T-031.2, AC4).

   The server's message already names the balance and the listing fee, so it is
   shown as-is; only the `code` decides whether the answer is the top-up prompt
   or a plain retry. Keying on `code` and not the message keeps the prompt safe
   from copy changes (the route throws `insufficient_balance` from
   `checkWalletBalanceStep`). */

export type SubmitFailure = {
  /** The server's own message — it carries the two figures. */
  message: string;
  /** Whether to offer the top-up page instead of a blind retry. */
  topUp: boolean;
};

/** Read one refused submit. */
export function submitFailureInfo(code: string | undefined, message: string): SubmitFailure {
  return { message, topUp: code === 'insufficient_balance' };
}
