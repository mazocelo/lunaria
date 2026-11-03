import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useEquipamentoVerModel } from './equipamento-ver.model';
import VerEquipamentoView from './equipamento-ver.view';

export default function EquipamentoVerPage() {
  const model = useEquipamentoVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.EQUIPAMENTOS);
  const handleEdit = () => { if (model.equipamento) navigate(generateRoute.editarEquipamento(model.equipamento.id)); };

  return (
    <VerEquipamentoView
      equipamento={model.equipamento}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
