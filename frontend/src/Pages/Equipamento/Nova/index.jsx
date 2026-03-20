import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useEquipamentoNovaModel } from './equipamento-nova.model';
import NovoEquipamentoView from './equipamento-nova.view';

export default function EquipamentoNovaPage() {
  const model = useEquipamentoNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarEquipamento();
    if (result.success) navigate(ROUTES.EQUIPAMENTOS);
  };

  const handleCancel = () => navigate(ROUTES.EQUIPAMENTOS);

  return (
    <NovoEquipamentoView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
