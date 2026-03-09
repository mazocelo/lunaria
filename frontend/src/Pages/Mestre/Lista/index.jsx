import { useMestreListaModel } from './mestre-lista.model';
import MestreListaView from './mestre-lista.view';

export default function MestreListaPage() {
  const props = useMestreListaModel();
  return <MestreListaView {...props} />;
}
