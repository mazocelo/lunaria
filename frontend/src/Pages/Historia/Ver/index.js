import { useHistoriaVerModel } from './historia-ver.model';
import VerHistoriaView from './historia-ver.view';

export default function HistoriaVerPage() {
  const props = useHistoriaVerModel();
  return <VerHistoriaView {...props} />;
}
