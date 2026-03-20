import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useClasseEditarModel } from './classe-editar.model';
import EditarClasseView from './classe-editar.view';

export default function ClasseEditarPage() {
  const model = useClasseEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.saveClasse();
    if (result.success) navigate(ROUTES.CLASSES);
  };

  const handleCancel = () => navigate(ROUTES.CLASSES);

  return (
    <EditarClasseView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
