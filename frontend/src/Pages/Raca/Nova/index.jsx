import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useRacaNovaModel } from './raca-nova.model';
import NovaRacaView from './raca-nova.view';

export default function RacaNovaPage() {
  const model = useRacaNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarRaca();
    if (result.success) navigate(ROUTES.RACAS);
  };

  const handleCancel = () => navigate(ROUTES.RACAS);

  return (
    <NovaRacaView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
