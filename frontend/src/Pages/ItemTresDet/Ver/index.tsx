import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useItemTresDetVerModel } from './item-tresdet-ver.model';
import VerItemTresDetView from './item-tresdet-ver.view';

export default function ItemTresDetVerPage() {
  const model = useItemTresDetVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.ITENS_TRESDET);
  const handleEdit = () => { if (model.item) navigate(generateRoute.editarItemTresDet(model.item.id)); };

  return (
    <VerItemTresDetView
      item={model.item}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
