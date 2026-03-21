import React from 'react';
import { useParams } from 'react-router-dom';
import DocsSidebar from './DocsSidebar';
import DocsContent from './DocsContent';

export default function DocsLayout({ section, title, items }) {
  const { slug } = useParams();
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
