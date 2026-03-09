import { usePersonagemNovoModel } from './personagem-novo.model';
import NovoPersonagemView from './personagem-novo.view';

export default function PersonagemNovoPage() {
  const props = usePersonagemNovoModel();
  return <NovoPersonagemView {...props} />;
}
