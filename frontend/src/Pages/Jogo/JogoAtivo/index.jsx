import { useNavigate } from 'react-router-dom';
import { useJogoAtivoModel } from './jogo-ativo.model';
import JogoAtivoView from './jogo-ativo.view';

export default function JogoAtivoPage() {
  const navigate = useNavigate();
  const props = useJogoAtivoModel({ navigate });
  return <JogoAtivoView {...props} />;
}
