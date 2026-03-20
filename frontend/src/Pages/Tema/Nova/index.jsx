import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.js';
import { useTemaNovaModel } from './tema-nova.model';
import NovoTemaView from './tema-nova.view';

export default function TemaNovaPage() {
  const model = useTemaNovaModel();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await model.criarTema();
    if (result.success) navigate(ROUTES.TEMAS);
  };

  const handleCancel = () => navigate(ROUTES.TEMAS);

  return (
    <NovoTemaView
      {...model}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}
