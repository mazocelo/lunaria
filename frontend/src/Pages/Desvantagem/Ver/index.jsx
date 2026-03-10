import { useDesvantagemVerModel } from './desvantagem-ver.model';
import VerDesvantagemView from './desvantagem-ver.view';

export default function DesvantagemVerPage() {
  const props = useDesvantagemVerModel();
  return <VerDesvantagemView {...props} />;
}
