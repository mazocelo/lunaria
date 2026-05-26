import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useHabilidadeNovaModel } from './habilidade-nova.model';
import NovaHabilidadeView from './habilidade-nova.view';

export default function HabilidadeNovaPage() {
  const model = useHabilidadeNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.criarHabilidade();
    if (result.success) navigate(ROUTES.HABILIDADES);
  };

  const handleCancel = () => navigate(ROUTES.HABILIDADES);

  return (
    <NovaHabilidadeView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
