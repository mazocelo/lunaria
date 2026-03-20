import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useMestreVerModel } from './mestre-ver.model';
import VerMestreView from './mestre-ver.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao e logica de negocio.
 */
export default function MestreVerPage() {
  const model = useMestreVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);
  const handleEdit = () => { if (model.mestre) navigate(generateRoute.editarMestre(model.mestre.id)); };

  return (
    <VerMestreView
      mestre={model.mestre}
      loading={model.loading}
      error={model.error}
      voiceName={model.voiceName}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
