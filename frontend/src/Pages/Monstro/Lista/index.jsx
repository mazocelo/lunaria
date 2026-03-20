import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useMonstroListaModel } from './monstro-lista.model';
import MonstroListaView from './monstro-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function MonstroListaPage() {
  const model = useMonstroListaModel();
  const navigate = useNavigate();

  const handleVerMonstro = (id) => navigate(generateRoute.verMonstro(id));

  return (
    <MonstroListaView
      {...model}
      onVerMonstro={handleVerMonstro}
    />
  );
}
