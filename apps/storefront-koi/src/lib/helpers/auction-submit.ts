
export type SubmitFailure = {
  message: string;
  topUp: boolean;
};

export function submitFailureInfo(code: string | undefined, message: string): SubmitFailure {
  return { message, topUp: code === 'insufficient_balance' };
}
