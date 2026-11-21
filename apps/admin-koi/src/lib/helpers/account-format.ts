import type { AdminAccount } from '../data/accounts.ts';

type NameParts = Pick<AdminAccount, 'first_name' | 'last_name' | 'email'>;

export function accountName(account: NameParts): string {
  const name = [account.first_name, account.last_name].filter(Boolean).join(' ');
  return name || account.email || '—';
}

export function accountCreatedLabel(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(iso));
}
