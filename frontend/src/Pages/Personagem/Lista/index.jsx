import { useNavigate } from 'react-router-dom';
import { usePersonagemListaModel } from './personagem-lista.model';
import PersonagemListaView from './personagem-lista.view';

export default function PersonagemListaPage() {
  const navigate = useNavigate();
  const props = usePersonagemListaModel({ navigate });
  return <PersonagemListaView {...props} />;
}
