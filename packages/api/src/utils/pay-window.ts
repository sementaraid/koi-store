// D-058: the winner pays the farmer directly within 1×24 h of the close.
// One number, shared by the winner's `pay_by` (store/won-lots) and the
// farmer's non-payment deadline (workflows/steps/lot-report).
export const PAY_WINDOW_MS = 24 * 60 * 60 * 1000
