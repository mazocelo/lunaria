import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useDesvantagemListaModel } from './desvantagem-lista.model';
import DesvantagemListaView from './desvantagem-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function DesvantagemListaPage() {
  const model = useDesvantagemListaModel();
  const navigate = useNavigate();

  const handleVerDesvantagem = (id) => navigate(generateRoute.verDesvantagem(id));

  return (
    <DesvantagemListaView
      {...model}
      onVerDesvantagem={handleVerDesvantagem}
    />
  );
}
