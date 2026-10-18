import { getShell } from '@/lib/shell';

import { LoginForm } from './components/LoginForm';

/* The server half of the pair every section here keeps: it gathers the bar's
   session state and hands it down. The route guards against an already
   signed-in visitor, so this one only has to draw. */
export async function LoginPage() {
  const { account, cart } = await getShell();

  return <LoginForm account={account} cart={cart} />;
}
