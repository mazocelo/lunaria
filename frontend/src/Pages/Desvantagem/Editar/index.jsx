import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useDesvantagemEditarModel } from './desvantagem-editar.model';
import EditarDesvantagemView from './desvantagem-editar.view';

export default function DesvantagemEditarPage() {
  const model = useDesvantagemEditarModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.saveDesvantagem();
    if (result.success) navigate(ROUTES.DESVANTAGENS);
  };

  const handleCancel = () => navigate(ROUTES.DESVANTAGENS);

  return (
    <EditarDesvantagemView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
