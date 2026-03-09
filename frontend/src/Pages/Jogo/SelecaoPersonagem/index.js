import { useSelecaoPersonagemModel } from './selecao-personagem.model';
import SelecaoPersonagemView from './selecao-personagem.view';

export default function SelecaoPersonagemPage() {
  const props = useSelecaoPersonagemModel();
  return <SelecaoPersonagemView {...props} />;
}
