import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../../constants/routes';
import { useEquipamentoListaModel } from './equipamento-lista.model';
import EquipamentoListaView from './equipamento-lista.view';

export default function EquipamentoListaPage() {
  const model = useEquipamentoListaModel();
  const navigate = useNavigate();

  const handleVerEquipamento = (id: number | string) => navigate(generateRoute.verEquipamento(id));
  const handleEditarEquipamento = (id: number | string) => navigate(generateRoute.editarEquipamento(id));

  return (
    <EquipamentoListaView
      {...model}
      onVerEquipamento={handleVerEquipamento}
      onEditarEquipamento={handleEditarEquipamento}
    />
  );
}
