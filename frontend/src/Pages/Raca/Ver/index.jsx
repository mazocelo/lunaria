import { useRacaVerModel } from './raca-ver.model';
import VerRacaView from './raca-ver.view';

export default function RacaVerPage() {
  const props = useRacaVerModel();
  return <VerRacaView {...props} />;
}
