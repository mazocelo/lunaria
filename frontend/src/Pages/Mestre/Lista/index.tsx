import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useMestreListaModel } from './mestre-lista.model';
import MestreListaView from './mestre-lista.view';

export default function MestreListaPage() {
  const model = useMestreListaModel();
  const navigate = useNavigate();

  const handleVerMestre = (id: number | string) => navigate(generateRoute.verMestre(id));
  const handleEditarMestre = (id: number | string) => navigate(generateRoute.editarMestre(id));
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
