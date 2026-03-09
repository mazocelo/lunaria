import { useHistoriaListaModel } from './historia-lista.model';
import HistoriaListaView from './historia-lista.view';

export default function HistoriaListaPage() {
  const props = useHistoriaListaModel();
  return <HistoriaListaView {...props} />;
}
