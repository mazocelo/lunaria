import { useNavigate } from 'react-router-dom';
import { useSelecaoPersonagemModel } from './selecao-personagem.model';
import SelecaoPersonagemView from './selecao-personagem.view';

export default function SelecaoPersonagemPage() {
  const navigate = useNavigate();
  const props = useSelecaoPersonagemModel({ navigate });
  return <SelecaoPersonagemView {...props} />;
}
