import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useMestreNovaModel } from './mestre-nova.model';
import NovaMestreView from './mestre-nova.view';

export default function MestreNovaPage() {
  const model = useMestreNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.criarMestre();
    if (result.success) navigate(ROUTES.MESTRES);
  };

  const handleCancel = () => navigate(ROUTES.MESTRES);

  return (
    <NovaMestreView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
