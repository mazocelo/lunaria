import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useMonstroListaModel } from './monstro-lista.model';
import MonstroListaView from './monstro-lista.view';

export default function MonstroListaPage() {
  const model = useMonstroListaModel();
  const navigate = useNavigate();

  const handleVerMonstro = (id: number | string) => navigate(generateRoute.verMonstro(id));

  return (
    <MonstroListaView
      {...model}
      onVerMonstro={handleVerMonstro}
    />
  );
}
