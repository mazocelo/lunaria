import { useVantagemVerModel } from './vantagem-ver.model';
import VerVantagemView from './vantagem-ver.view';

export default function VantagemVerPage() {
  const props = useVantagemVerModel();
  return <VerVantagemView {...props} />;
}
