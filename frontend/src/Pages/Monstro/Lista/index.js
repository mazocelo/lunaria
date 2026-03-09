import { useMonstroListaModel } from './monstro-lista.model';
import MonstroListaView from './monstro-lista.view';

export default function MonstroListaPage() {
  const props = useMonstroListaModel();
  return <MonstroListaView {...props} />;
}
