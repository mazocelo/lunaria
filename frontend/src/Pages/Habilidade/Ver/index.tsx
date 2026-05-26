import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes';
import { useHabilidadeVerModel } from './habilidade-ver.model';
import VerHabilidadeView from './habilidade-ver.view';

export default function HabilidadeVerPage() {
  const model = useHabilidadeVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.HABILIDADES);
  const handleEdit = () => { if (model.habilidade) navigate(generateRoute.editarHabilidade(model.habilidade.id)); };

  return (
    <VerHabilidadeView
      habilidade={model.habilidade}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
