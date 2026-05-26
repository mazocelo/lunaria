import { useDocsInternoModel } from './docs-interno.model';
import DocsInternoView from './docs-interno.view';

export default function DocsInternoPage() {
  const model = useDocsInternoModel();
  return <DocsInternoView {...model} />;
}
