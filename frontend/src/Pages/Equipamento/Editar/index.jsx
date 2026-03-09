import { useEquipamentoEditarModel } from './equipamento-editar.model';
import EditarEquipamentoView from './equipamento-editar.view';

export default function EquipamentoEditarPage() {
  const props = useEquipamentoEditarModel();
  return <EditarEquipamentoView {...props} />;
}
