import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useRacaListaModel } from './raca-lista.model';
import RacaListaView from './raca-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function RacaListaPage() {
  const model = useRacaListaModel();
  const navigate = useNavigate();

  const handleVerRaca = (id) => navigate(generateRoute.verRaca(id));

  return (
    <RacaListaView
      {...model}
      onVerRaca={handleVerRaca}
    />
  );
}
