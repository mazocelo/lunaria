import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useItemTresDetNovaModel } from './item-tresdet-nova.model';
import NovoItemTresDetView from './item-tresdet-nova.view';

export default function ItemTresDetNovaPage() {
  const model = useItemTresDetNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.criarItem();
    if (result.success) navigate(ROUTES.ITENS_TRESDET);
  };

  const handleCancel = () => navigate(ROUTES.ITENS_TRESDET);

  return (
    <NovoItemTresDetView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
