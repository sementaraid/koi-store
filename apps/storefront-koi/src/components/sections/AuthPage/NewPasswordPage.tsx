import { getShell } from '@/lib/shell';

import { NewPasswordForm } from './components/NewPasswordForm';

export async function NewPasswordPage({ token }: { token?: string }) {
  const { account, cart } = await getShell();

  return <NewPasswordForm token={token} account={account} cart={cart} />;
}
