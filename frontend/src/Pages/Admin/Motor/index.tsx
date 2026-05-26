import { useAdminMotorModel } from './admin-motor.model';
import AdminMotorView from './admin-motor.view';
import { useTheme } from '../../../contexts/theme';

export default function AdminMotorPage() {
  const props = useAdminMotorModel();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return <AdminMotorView {...props} isDark={isDark} />;
}
