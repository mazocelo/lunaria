import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useHabilidadeListaModel } from './habilidade-lista.model';
import HabilidadeListaView from './habilidade-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function HabilidadeListaPage() {
  const model = useHabilidadeListaModel();
  const navigate = useNavigate();

  const handleVerHabilidade = (id) => navigate(generateRoute.verHabilidade(id));

  return (
    <HabilidadeListaView
      {...model}
      onVerHabilidade={handleVerHabilidade}
    />
  );
}
