import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useDesvantagemListaModel } from './desvantagem-lista.model';
import DesvantagemListaView from './desvantagem-lista.view';

export default function DesvantagemListaPage() {
  const model = useDesvantagemListaModel();
  const navigate = useNavigate();

  const handleVerDesvantagem = (id: number | string) => navigate(generateRoute.verDesvantagem(id));

  return (
    <DesvantagemListaView
      {...model}
      onVerDesvantagem={handleVerDesvantagem}
    />
  );
}
