import { useNavigate } from 'react-router-dom';
import { ROUTES, generateRoute } from '../../../constants/routes.js';
import { useMonstroVerModel } from './monstro-ver.model';
import VerMonstroView from './monstro-ver.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View, fornece handlers de navegacao e logica de negocio.
 * Sem JSX, sem classes CSS, sem resolucao de tema.
 */
export default function MonstroVerPage() {
  const model = useMonstroVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => { if (model.monstro) navigate(generateRoute.editarMonstro(model.monstro.id)); };

  return (
    <VerMonstroView
      monstro={model.monstro}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
