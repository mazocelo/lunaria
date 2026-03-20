import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useRacaEditarModel } from './raca-editar.model';
import EditarRacaView from './raca-editar.view';

export default function RacaEditarPage() {
  const model = useRacaEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.saveRaca();
    if (result.success) navigate(ROUTES.RACAS);
  };

  const handleCancel = () => navigate(ROUTES.RACAS);

  return (
    <EditarRacaView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
