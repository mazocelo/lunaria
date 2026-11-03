import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useMestreEditarModel } from './mestre-editar.model';
import EditarMestreView from './mestre-editar.view';

export default function MestreEditarPage() {
  const model = useMestreEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveMestre();
    if (result.success) navigate(ROUTES.MESTRES);
  };

  const handleCancel = () => navigate(ROUTES.MESTRES);

  return (
    <EditarMestreView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
