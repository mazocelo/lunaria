import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useMestreVerModel } from './mestre-ver.model';
import VerMestreView from './mestre-ver.view';

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
