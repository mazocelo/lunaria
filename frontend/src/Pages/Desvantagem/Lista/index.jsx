import { useDesvantagemListaModel } from './desvantagem-lista.model';
import DesvantagemListaView from './desvantagem-lista.view';

export default function DesvantagemListaPage() {
  const props = useDesvantagemListaModel();
  return <DesvantagemListaView {...props} />;
}
