import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useMagiaTresDetEditarModel } from './magia-tresdet-editar.model';
import EditarMagiaTresDetView from './magia-tresdet-editar.view';

export default function MagiaTresDetEditarPage() {
  const model = useMagiaTresDetEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveMagia();
    if (result.success) navigate(ROUTES.MAGIAS_TRESDET);
  };

  const handleCancel = () => navigate(ROUTES.MAGIAS_TRESDET);

  return (
    <EditarMagiaTresDetView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
