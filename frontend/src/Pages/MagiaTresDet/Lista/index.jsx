import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useMagiaTresDetListaModel } from './magia-tresdet-lista.model';
import MagiaTresDetListaView from './magia-tresdet-lista.view';

export default function MagiaTresDetListaPage() {
  const model = useMagiaTresDetListaModel();
  const navigate = useNavigate();

  const handleVerMagia = (id) => navigate(generateRoute.verMagiaTresDet(id));
  const handleEditarMagia = (id) => navigate(generateRoute.editarMagiaTresDet(id));

  return (
    <MagiaTresDetListaView
      {...model}
      onVerMagia={handleVerMagia}
      onEditarMagia={handleEditarMagia}
    />
  );
}
