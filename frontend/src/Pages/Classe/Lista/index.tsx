import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useClasseListaModel } from './classe-lista.model';
import ClasseListaView from './classe-lista.view';

export default function ClasseListaPage() {
  const model = useClasseListaModel();
  const navigate = useNavigate();

  const handleVerClasse = (id: number | string) => navigate(generateRoute.verClasse(id));

  return (
    <ClasseListaView
      {...model}
      onVerClasse={handleVerClasse}
    />
  );
}
