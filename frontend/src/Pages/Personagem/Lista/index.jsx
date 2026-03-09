import { usePersonagemListaModel } from './personagem-lista.model';
import PersonagemListaView from './personagem-lista.view';

export default function PersonagemListaPage() {
  const props = usePersonagemListaModel();
  return <PersonagemListaView {...props} />;
}
