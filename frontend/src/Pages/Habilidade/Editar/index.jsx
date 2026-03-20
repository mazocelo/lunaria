import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useHabilidadeEditarModel } from './habilidade-editar.model';
import EditarHabilidadeView from './habilidade-editar.view';

export default function HabilidadeEditarPage() {
  const model = useHabilidadeEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.saveHabilidade();
    if (result.success) navigate(ROUTES.HABILIDADES);
  };

  const handleCancel = () => navigate(ROUTES.HABILIDADES);

  return (
    <EditarHabilidadeView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
