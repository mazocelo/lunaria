import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useItemTresDetListaModel } from './item-tresdet-lista.model';
import ItemTresDetListaView from './item-tresdet-lista.view';

export default function ItemTresDetListaPage() {
  const model = useItemTresDetListaModel();
  const navigate = useNavigate();

  const handleVerItem = (id) => navigate(generateRoute.verItemTresDet(id));
  const handleEditarItem = (id) => navigate(generateRoute.editarItemTresDet(id));

  return (
    <ItemTresDetListaView
      {...model}
      onVerItem={handleVerItem}
      onEditarItem={handleEditarItem}
    />
  );
}
