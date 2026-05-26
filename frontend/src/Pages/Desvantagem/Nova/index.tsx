import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useDesvantagemNovaModel } from './desvantagem-nova.model';
import NovaDesvantagemView from './desvantagem-nova.view';

export default function DesvantagemNovaPage() {
  const model = useDesvantagemNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.criarDesvantagem();
    if (result.success) navigate(ROUTES.DESVANTAGENS);
  };

  const handleCancel = () => navigate(ROUTES.DESVANTAGENS);

  return (
    <NovaDesvantagemView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
