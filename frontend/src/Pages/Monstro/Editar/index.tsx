import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useMonstroEditarModel } from './monstro-editar.model';
import EditarMonstroView from './monstro-editar.view';

export default function MonstroEditarPage() {
  const model = useMonstroEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveMonstro();
    if (result.success) navigate(ROUTES.MONSTROS);
  };

  const handleCancel = () => navigate(ROUTES.MONSTROS);

  return (
    <EditarMonstroView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
