import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useTemaEditarModel } from './tema-editar.model';
import EditarTemaView from './tema-editar.view';

export default function TemaEditarPage() {
  const model = useTemaEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveTema();
    if (result.success) navigate(ROUTES.TEMAS);
  };

  const handleCancel = () => navigate(ROUTES.TEMAS);

  return (
    <EditarTemaView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
