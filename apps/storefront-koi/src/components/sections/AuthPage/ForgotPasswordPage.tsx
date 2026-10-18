import { getShell } from '@/lib/shell';

import { ForgotPasswordForm } from './components/ForgotPasswordForm';

export async function ForgotPasswordPage() {
  const { account, cart } = await getShell();

  return <ForgotPasswordForm account={account} cart={cart} />;
}
