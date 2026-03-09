import { useRacaListaModel } from './raca-lista.model';
import RacaListaView from './raca-lista.view';

export default function RacaListaPage() {
  const props = useRacaListaModel();
  return <RacaListaView {...props} />;
}
