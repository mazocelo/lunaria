import { useDesvantagemNovaModel } from './desvantagem-nova.model';
import NovaDesvantagemView from './desvantagem-nova.view';

export default function DesvantagemNovaPage() {
  const props = useDesvantagemNovaModel();
  return <NovaDesvantagemView {...props} />;
}
