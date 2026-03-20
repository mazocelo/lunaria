import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useClasseNovaModel } from './classe-nova.model';
import NovaClasseView from './classe-nova.view';

export default function ClasseNovaPage() {
  const model = useClasseNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarClasse();
    if (result.success) navigate(ROUTES.CLASSES);
  };

  const handleCancel = () => navigate(ROUTES.CLASSES);

  return (
    <NovaClasseView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
