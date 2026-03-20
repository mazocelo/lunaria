import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useMestreListaModel } from './mestre-lista.model';
import MestreListaView from './mestre-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function MestreListaPage() {
  const model = useMestreListaModel();
  const navigate = useNavigate();

  const handleVerMestre = (id) => navigate(generateRoute.verMestre(id));
  const handleEditarMestre = (id) => navigate(generateRoute.editarMestre(id));
  const handleNovoMestre = () => navigate(ROUTES.NOVO_MESTRE);

  return (
    <MestreListaView
      {...model}
      onVerMestre={handleVerMestre}
      onEditarMestre={handleEditarMestre}
      onNovoMestre={handleNovoMestre}
    />
  );
}
