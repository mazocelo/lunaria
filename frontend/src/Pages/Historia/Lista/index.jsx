import { useNavigate } from 'react-router-dom';
import { useHistoriaListaModel } from './historia-lista.model';
import HistoriaListaView from './historia-lista.view';

export default function HistoriaListaPage() {
  const navigate = useNavigate();
  const props = useHistoriaListaModel({ navigate });
  return <HistoriaListaView {...props} />;
}
