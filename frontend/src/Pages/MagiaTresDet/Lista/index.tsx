import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useMagiaTresDetListaModel } from './magia-tresdet-lista.model';
import MagiaTresDetListaView from './magia-tresdet-lista.view';

export default function MagiaTresDetListaPage() {
  const model = useMagiaTresDetListaModel();
  const navigate = useNavigate();

  const handleVerMagia = (id: number | string) => navigate(generateRoute.verMagiaTresDet(id));
  const handleEditarMagia = (id: number | string) => navigate(generateRoute.editarMagiaTresDet(id));

  return (
    <MagiaTresDetListaView
      {...model}
      onVerMagia={handleVerMagia}
      onEditarMagia={handleEditarMagia}
    />
  );
}
