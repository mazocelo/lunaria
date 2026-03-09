import { useEquipamentoVerModel } from './equipamento-ver.model';
import VerEquipamentoView from './equipamento-ver.view';

export default function EquipamentoVerPage() {
  const props = useEquipamentoVerModel();
  return <VerEquipamentoView {...props} />;
}
