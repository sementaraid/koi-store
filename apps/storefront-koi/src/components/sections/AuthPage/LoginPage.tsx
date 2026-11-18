import { getShell } from '@/lib/shell';

import { LoginForm } from './components/LoginForm';

export async function LoginPage() {
  const { account, cart } = await getShell();

  return <LoginForm account={account} cart={cart} />;
}
