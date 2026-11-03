import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useVantagemEditarModel } from './vantagem-editar.model';
import EditarVantagemView from './vantagem-editar.view';

export default function VantagemEditarPage() {
  const model = useVantagemEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await model.saveVantagem();
    if (result.success) navigate(ROUTES.VANTAGENS);
  };

  const handleCancel = () => navigate(ROUTES.VANTAGENS);

  return (
    <EditarVantagemView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
