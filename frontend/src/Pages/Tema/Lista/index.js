import { useTemaListaModel } from './tema-lista.model';
import TemaListaView from './tema-lista.view';

export default function TemaListaPage() {
  const props = useTemaListaModel();
  return <TemaListaView {...props} />;
}
