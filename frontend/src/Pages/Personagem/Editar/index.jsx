import { usePersonagemEditarModel } from './personagem-editar.model';
import EditarPersonagemView from './personagem-editar.view';

export default function PersonagemEditarPage() {
  const props = usePersonagemEditarModel();
  return <EditarPersonagemView {...props} />;
}
