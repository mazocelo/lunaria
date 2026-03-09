import { useConviteJogoModel } from './convite-jogo.model';
import ConviteJogoView from './convite-jogo.view';

export default function ConviteJogoPage() {
  const props = useConviteJogoModel();
  return <ConviteJogoView {...props} />;
}
