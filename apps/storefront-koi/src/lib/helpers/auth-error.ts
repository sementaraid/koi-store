
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
