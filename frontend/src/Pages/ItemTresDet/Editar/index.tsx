import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useItemTresDetEditarModel } from './item-tresdet-editar.model';
import EditarItemTresDetView from './item-tresdet-editar.view';

export default function ItemTresDetEditarPage() {
  const model = useItemTresDetEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveItem();
    if (result.success) navigate(ROUTES.ITENS_TRESDET);
  };

  const handleCancel = () => navigate(ROUTES.ITENS_TRESDET);

  return (
    <EditarItemTresDetView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
