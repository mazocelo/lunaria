import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes.js';
import { useEquipamentoListaModel } from './equipamento-lista.model';
import EquipamentoListaView from './equipamento-lista.view';

/**
 * ViewModel: orquestracao pura.
 * Conecta Model e View. Handlers de navegacao.
 */
export default function EquipamentoListaPage() {
  const model = useEquipamentoListaModel();
  const navigate = useNavigate();

  const handleVerEquipamento = (id) => navigate(generateRoute.verEquipamento(id));
  const handleEditarEquipamento = (id) => navigate(generateRoute.editarEquipamento(id));

  return (
    <EquipamentoListaView
      {...model}
      onVerEquipamento={handleVerEquipamento}
      onEditarEquipamento={handleEditarEquipamento}
    />
  );
}
