import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useTemaListaModel } from './tema-lista.model';
import TemaListaView from './tema-lista.view';

export default function TemaListaPage() {
  const model = useTemaListaModel();
  const navigate = useNavigate();

  const handleEditarTema = (id: number | string) => navigate(generateRoute.editarTema(id));
  const handleNovoTema = () => navigate(ROUTES.NOVO_TEMA);

  return (
    <TemaListaView
      {...model}
      onEditarTema={handleEditarTema}
      onNovoTema={handleNovoTema}
    />
  );
}
