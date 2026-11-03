import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useEquipamentoEditarModel } from './equipamento-editar.model';
import EditarEquipamentoView from './equipamento-editar.view';

export default function EquipamentoEditarPage() {
  const model = useEquipamentoEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveEquipamento();
    if (result.success) navigate(ROUTES.EQUIPAMENTOS);
  };

  const handleCancel = () => navigate(ROUTES.EQUIPAMENTOS);

  return (
    <EditarEquipamentoView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
