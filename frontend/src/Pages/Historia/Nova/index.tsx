import { useNavigate } from 'react-router-dom';
import { useHistoriaNovaModel } from './historia-nova.model';
import NovaHistoriaView from './historia-nova.view';

export default function HistoriaNovaPage() {
  const navigate = useNavigate();
  const props = useHistoriaNovaModel({ navigate });
  return <NovaHistoriaView {...props} />;
}
