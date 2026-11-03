import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useVantagemListaModel } from './vantagem-lista.model';
import VantagemListaView from './vantagem-lista.view';

export default function VantagemListaPage() {
  const model = useVantagemListaModel();
  const navigate = useNavigate();

  const handleVerVantagem = (id: number | string) => navigate(generateRoute.verVantagem(id));

  return (
    <VantagemListaView
      {...model}
      onVerVantagem={handleVerVantagem}
    />
  );
}
