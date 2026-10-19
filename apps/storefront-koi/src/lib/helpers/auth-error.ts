/* What a failed auth call says to the visitor.

   The server actions hand back Medusa's own message, which is written for
   whoever built the store: `Error: Identity with email already exists`. This
   maps the handful a customer can act on into the house's Indonesian, and
   falls back to a plain sentence for everything else — an accurate but alien
   error is worse than a general apology next to a form the visitor can retry. */

const KNOWN: [RegExp, string][] = [
  [
    /identity with email already exists|already exists/i,
    'Email ini sudah terdaftar. Silakan masuk dengan email tersebut.'
  ],
  [
    /invalid email or password|unauthorized|invalid credentials/i,
    'Email atau kata sandi salah. Periksa kembali dan coba lagi.'
  ],
  [
    /password.*(minimum|length)|too short/i,
    'Kata sandi belum memenuhi syarat minimal.'
  ]
];

export function authErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');

  for (const [pattern, message] of KNOWN) {
    if (pattern.test(raw)) return message;
  }

  return fallback;
}
