import { useResetPasswordModel } from './reset-password.model';
import ResetPasswordView from './reset-password.view';

export default function ResetPasswordPage() {
  const props = useResetPasswordModel();
  return <ResetPasswordView {...props} />;
}
