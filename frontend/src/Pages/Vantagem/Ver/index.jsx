import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useVantagemVerModel } from './vantagem-ver.model';
import VerVantagemView from './vantagem-ver.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao e logica de negocio.
 */
export default function VantagemVerPage() {
  const model = useVantagemVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.VANTAGENS);
  const handleEdit = () => { if (model.vantagem) navigate(generateRoute.editarVantagem(model.vantagem.id)); };

  return (
    <VerVantagemView
      vantagem={model.vantagem}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
