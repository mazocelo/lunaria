import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useVantagemNovaModel } from './vantagem-nova.model';
import NovaVantagemView from './vantagem-nova.view';

export default function VantagemNovaPage() {
  const model = useVantagemNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarVantagem();
    if (result.success) navigate(ROUTES.VANTAGENS);
  };

  const handleCancel = () => navigate(ROUTES.VANTAGENS);

  return (
    <NovaVantagemView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
