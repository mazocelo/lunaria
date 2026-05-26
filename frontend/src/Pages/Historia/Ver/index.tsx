import { useNavigate } from 'react-router-dom';
import { useHistoriaVerModel } from './historia-ver.model';
import VerHistoriaView from './historia-ver.view';

export default function HistoriaVerPage() {
  const navigate = useNavigate();
  const props = useHistoriaVerModel({ navigate });
  return <VerHistoriaView {...props} />;
}
