import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useMagiaTresDetNovaModel } from './magia-tresdet-nova.model';
import NovaMagiaTresDetView from './magia-tresdet-nova.view';

export default function MagiaTresDetNovaPage() {
  const model = useMagiaTresDetNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.criarMagia();
    if (result.success) navigate(ROUTES.MAGIAS_TRESDET);
  };

  const handleCancel = () => navigate(ROUTES.MAGIAS_TRESDET);

  return (
    <NovaMagiaTresDetView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
