import { useBillingModel } from './billing.model';
import BillingView from './billing.view';
import { useTheme } from '../../contexts/theme';

export default function BillingPage() {
  const props = useBillingModel();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return <BillingView {...props} isDark={isDark} />;
}
