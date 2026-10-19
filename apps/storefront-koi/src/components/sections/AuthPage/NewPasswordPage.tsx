import { getShell } from '@/lib/shell';

import { NewPasswordForm } from './components/NewPasswordForm';

/** @param token the reset email's credential, read off `?token=` by the route. */
export async function NewPasswordPage({ token }: { token?: string }) {
  const { account, cart } = await getShell();

  return <NewPasswordForm token={token} account={account} cart={cart} />;
}
