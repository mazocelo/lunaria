import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useClasseVerModel } from './classe-ver.model';
import VerClasseView from './classe-ver.view';

export default function ClasseVerPage() {
  const model = useClasseVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.CLASSES);
  const handleEdit = () => { if (model.classe) navigate(generateRoute.editarClasse(model.classe.id)); };

  return (
    <VerClasseView
      classe={model.classe}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
