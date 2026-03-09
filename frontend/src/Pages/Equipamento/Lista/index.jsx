import { useEquipamentoListaModel } from './equipamento-lista.model';
import EquipamentoListaView from './equipamento-lista.view';

export default function EquipamentoListaPage() {
  const props = useEquipamentoListaModel();
  return <EquipamentoListaView {...props} />;
}
