import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useClasseListaModel } from './classe-lista.model';
import ClasseListaView from './classe-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function ClasseListaPage() {
  const model = useClasseListaModel();
  const navigate = useNavigate();

  const handleVerClasse = (id) => navigate(generateRoute.verClasse(id));

  return (
    <ClasseListaView
      {...model}
      onVerClasse={handleVerClasse}
    />
  );
}
