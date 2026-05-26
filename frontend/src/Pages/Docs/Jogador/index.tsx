import { useDocsJogadorModel } from './docs-jogador.model';
import DocsJogadorView from './docs-jogador.view';

export default function DocsJogadorPage() {
  const model = useDocsJogadorModel();
  return <DocsJogadorView {...model} />;
}
