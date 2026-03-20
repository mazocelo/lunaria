import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useVantagemListaModel } from './vantagem-lista.model';
import VantagemListaView from './vantagem-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function VantagemListaPage() {
  const model = useVantagemListaModel();
  const navigate = useNavigate();

  const handleVerVantagem = (id) => navigate(generateRoute.verVantagem(id));

  return (
    <VantagemListaView
      {...model}
      onVerVantagem={handleVerVantagem}
    />
  );
}
