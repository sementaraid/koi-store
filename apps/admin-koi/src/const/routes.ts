/* The back office's URL shape, in one place. Paths only — no React, no imports.
   Same arrangement as the storefront's `const/routes.ts`, and for the same
   reason: a route name spelled out at every link is a route name that cannot be
   changed in one edit.

   Indonesian paths, like the storefront: the operators are the same house. */

export const ROUTES = {
  /** The operator's landing screen — what needs attention today. */
  home: '/',
  /** Sign in. */
  login: '/masuk',
  /** The way out. A server action, not a page. */
  signout: '/keluar',

  /* --- Milestone 2 onward. Listed here as the back office's agreed map, so
     every screen that links to a sibling has one spelling to use. The nav draws
     only what exists (see `const/nav.ts`). --- */

  /** Farm registrations waiting on a decision. */
  farms: '/kebun',
  /** Top-up requests: screenshot against bank statement. */
  topups: '/saldo/topup',
  /** Hand-written balance corrections. */
  adjustments: '/saldo/koreksi',
  /** The fee table, and the extend window. */
  fees: '/pengaturan/biaya',
  /** Auctions waiting on approval. */
  auctions: '/lelang',
  /** Accounts: strikes, bans, who is who. */
  users: '/pengguna',
  /** Dead-on-arrival claims an operator has to decide. */
  claims: '/klaim'
} as const;
