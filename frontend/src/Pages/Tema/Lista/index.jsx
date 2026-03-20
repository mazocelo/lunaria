import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useTemaListaModel } from './tema-lista.model';
import TemaListaView from './tema-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function TemaListaPage() {
  const model = useTemaListaModel();
  const navigate = useNavigate();

  const handleEditarTema = (id) => navigate(generateRoute.editarTema(id));
  const handleNovoTema = () => navigate(ROUTES.NOVO_TEMA);

  return (
    <TemaListaView
      {...model}
      onEditarTema={handleEditarTema}
      onNovoTema={handleNovoTema}
    />
  );
}
