import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useRacaListaModel } from './raca-lista.model';
import RacaListaView from './raca-lista.view';

export default function RacaListaPage() {
  const model = useRacaListaModel();
  const navigate = useNavigate();

  const handleVerRaca = (id: number | string) => navigate(generateRoute.verRaca(id));

  return (
    <RacaListaView
      {...model}
      onVerRaca={handleVerRaca}
    />
  );
}
