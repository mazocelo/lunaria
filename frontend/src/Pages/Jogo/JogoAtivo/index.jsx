import { useJogoAtivoModel } from './jogo-ativo.model';
import JogoAtivoView from './jogo-ativo.view';

export default function JogoAtivoPage() {
  const props = useJogoAtivoModel();
  return <JogoAtivoView {...props} />;
}
