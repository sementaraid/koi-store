// D-068, D-079: the winner transfers to the company account within 1×24 h of
// the close. One number, shared by the `pay_by` reads (store/won-lots,
// vendor/sold-lots) and the admin payment queue (admin/lots, D-079).
export const PAY_WINDOW_MS = 24 * 60 * 60 * 1000
