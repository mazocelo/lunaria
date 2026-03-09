import { useVantagemNovaModel } from './vantagem-nova.model';
import NovaVantagemView from './vantagem-nova.view';

export default function VantagemNovaPage() {
  const props = useVantagemNovaModel();
  return <NovaVantagemView {...props} />;
}
