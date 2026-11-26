// US-108 AC1 (D-068): the winner transfers to the company account. The three
// bank values come from the platform setting; any blank one leaves the winner
// without a destination, so the card tells them to ask an admin instead.

export type WonPaymentBank = {
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
};

export type CompleteWonPaymentBank = {
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
};

export type WonPaymentInfo = {
  // null when a value is missing: never render a half-filled account.
  bank: CompleteWonPaymentBank | null;
  // True at or after closed_at + 24 h, while the lot is still `won`.
  overdue: boolean;
};

const filled = (value: string | null): value is string => Boolean(value && value.trim());

function completeBank(bank: WonPaymentBank | null | undefined): CompleteWonPaymentBank | null {
  if (!bank) return null;

  const { bank_name, bank_account_number, bank_account_holder } = bank;
  if (!filled(bank_name) || !filled(bank_account_number) || !filled(bank_account_holder)) {
    return null;
  }

  return {
    bank_name: bank_name.trim(),
    bank_account_number: bank_account_number.trim(),
    bank_account_holder: bank_account_holder.trim()
  };
}

export function wonPaymentInfo(input: {
  payBy: string | null;
  bank: WonPaymentBank | null | undefined;
  now: number;
}): WonPaymentInfo {
  const deadline = input.payBy ? Date.parse(input.payBy) : Number.NaN;

  return {
    bank: completeBank(input.bank),
    overdue: Number.isFinite(deadline) && input.now >= deadline
  };
}
