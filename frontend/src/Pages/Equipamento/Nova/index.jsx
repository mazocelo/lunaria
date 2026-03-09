import { useEquipamentoNovaModel } from './equipamento-nova.model';
import NovoEquipamentoView from './equipamento-nova.view';

export default function EquipamentoNovaPage() {
  const props = useEquipamentoNovaModel();
  return <NovoEquipamentoView {...props} />;
}
