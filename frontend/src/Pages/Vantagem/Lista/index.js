import { useVantagemListaModel } from './vantagem-lista.model';
import VantagemListaView from './vantagem-lista.view';

export default function VantagemListaPage() {
  const props = useVantagemListaModel();
  return <VantagemListaView {...props} />;
}
