import { useNavigate } from 'react-router-dom';
import { useConviteJogoModel } from './convite-jogo.model';
import ConviteJogoView from './convite-jogo.view';

export default function ConviteJogoPage() {
  const navigate = useNavigate();
  const props = useConviteJogoModel({ navigate });
  return <ConviteJogoView {...props} />;
}
