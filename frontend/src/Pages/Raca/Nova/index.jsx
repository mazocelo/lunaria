import { useRacaNovaModel } from './raca-nova.model';
import NovaRacaView from './raca-nova.view';

export default function RacaNovaPage() {
  const props = useRacaNovaModel();
  return <NovaRacaView {...props} />;
}
