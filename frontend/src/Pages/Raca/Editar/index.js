import { useRacaEditarModel } from './raca-editar.model';
import EditarRacaView from './raca-editar.view';

export default function RacaEditarPage() {
  const props = useRacaEditarModel();
  return <EditarRacaView {...props} />;
}
