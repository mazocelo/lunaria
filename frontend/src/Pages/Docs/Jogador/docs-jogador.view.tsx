import DocsLayout from '../../../components/docs/DocsLayout';
import type { DocsSection } from '../../../components/docs/DocsLayout';
import type { DocsSidebarItem } from './docs-jogador.model';

interface DocsJogadorViewProps {
  section: DocsSection;
  title: string;
  items: DocsSidebarItem[];
}

export default function DocsJogadorView({ section, title, items }: DocsJogadorViewProps) {
  return <DocsLayout section={section} title={title} items={items} />;
}
