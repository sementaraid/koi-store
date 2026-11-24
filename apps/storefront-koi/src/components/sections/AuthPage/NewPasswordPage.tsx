import { NewPasswordForm } from './components/NewPasswordForm';

export function NewPasswordPage({ token }: { token?: string }) {
  return <NewPasswordForm token={token} />;
}
