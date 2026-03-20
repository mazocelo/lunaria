import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useDesvantagemVerModel } from './desvantagem-ver.model';
import VerDesvantagemView from './desvantagem-ver.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao e logica de negocio.
 */
export default function DesvantagemVerPage() {
  const model = useDesvantagemVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.DESVANTAGENS);
  const handleEdit = () => { if (model.desvantagem) navigate(generateRoute.editarDesvantagem(model.desvantagem.id)); };

  return (
    <VerDesvantagemView
      desvantagem={model.desvantagem}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
