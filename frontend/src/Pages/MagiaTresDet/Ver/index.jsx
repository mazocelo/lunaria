import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useMagiaTresDetVerModel } from './magia-tresdet-ver.model';
import VerMagiaTresDetView from './magia-tresdet-ver.view';

export default function MagiaTresDetVerPage() {
  const model = useMagiaTresDetVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.MAGIAS_TRESDET);
  const handleEdit = () => { if (model.magia) navigate(generateRoute.editarMagiaTresDet(model.magia.id)); };

  return (
    <VerMagiaTresDetView
      magia={model.magia}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
