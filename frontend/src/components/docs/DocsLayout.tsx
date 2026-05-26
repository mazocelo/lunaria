import { useParams } from 'react-router-dom';
import DocsSidebar, { type DocsSidebarItem } from './DocsSidebar';
import DocsContent from './DocsContent';

export type DocsSection = 'jogador' | 'interno';

export interface DocsLayoutProps {
  section: DocsSection;
  title: string;
  items: DocsSidebarItem[];
}

export default function DocsLayout({ section, title, items }: DocsLayoutProps) {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug || 'index';

  return (
    <div className="flex h-full overflow-hidden">
      <DocsSidebar items={items} baseUrl={section === 'jogador' ? '/docs' : '/admin/docs'} title={title} />
      <main className="flex-1 overflow-y-auto">
        <DocsContent section={section} slug={activeSlug} />
      </main>
    </div>
  );
}
