import { useHistoriaNovaModel } from './historia-nova.model';
import NovaHistoriaView from './historia-nova.view';

export default function HistoriaNovaPage() {
  const props = useHistoriaNovaModel();
  return <NovaHistoriaView {...props} />;
}
