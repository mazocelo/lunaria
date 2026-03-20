import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useMonstroNovaModel } from './monstro-nova.model';
import NovoMonstroView from './monstro-nova.view';

export default function MonstroNovaPage() {
  const model = useMonstroNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarMonstro();
    if (result.success) navigate(ROUTES.MONSTROS);
  };

  const handleCancel = () => navigate(ROUTES.MONSTROS);

  return (
    <NovoMonstroView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
