import { getShell } from '@/lib/shell';

import { RegisterForm } from './components/RegisterForm';

export async function RegisterPage() {
  const { account, cart } = await getShell();

  return <RegisterForm account={account} cart={cart} />;
}
