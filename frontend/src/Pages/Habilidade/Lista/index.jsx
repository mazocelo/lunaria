import { useHabilidadeListaModel } from './habilidade-lista.model';
import HabilidadeListaView from './habilidade-lista.view';

export default function HabilidadeListaPage() {
  const props = useHabilidadeListaModel();
  return <HabilidadeListaView {...props} />;
}
