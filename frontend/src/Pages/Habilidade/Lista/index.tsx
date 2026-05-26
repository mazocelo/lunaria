import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useHabilidadeListaModel } from './habilidade-lista.model';
import HabilidadeListaView from './habilidade-lista.view';

export default function HabilidadeListaPage() {
  const model = useHabilidadeListaModel();
  const navigate = useNavigate();

  const handleVerHabilidade = (id: number | string) => navigate(generateRoute.verHabilidade(id));

  return (
    <HabilidadeListaView
      {...model}
      onVerHabilidade={handleVerHabilidade}
    />
  );
}
