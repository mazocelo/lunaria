import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useRacaVerModel } from './raca-ver.model';
import VerRacaView from './raca-ver.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao e logica de negocio.
 */
export default function RacaVerPage() {
  const model = useRacaVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.RACAS);
  const handleEdit = () => { if (model.raca) navigate(generateRoute.editarRaca(model.raca.id)); };

  return (
    <VerRacaView
      raca={model.raca}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
