import React from 'react';
import { useParams, Link } from 'react-router-dom';
import DocsContent from '../../../components/docs/DocsContent';
import { useTheme } from '../../../contexts/theme.jsx';
import { BookOpen, ScrollText } from 'lucide-react';

export default function DocsInternoView({ internoItems, jogadorItems, title }) {
  const { slug, section: sectionParam } = useParams();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const activeSection = sectionParam || 'interno';
  const activeSlug = slug || 'index';

  return (
    <div className="flex h-full overflow-hidden">
      <aside className={`w-64 flex-shrink-0 h-full overflow-y-auto border-r ${
        isLight ? 'bg-white/95 border-slate-200/60' : 'bg-slate-900/95 border-slate-700/50'
      }`}>
        <div className={`px-4 py-4 border-b ${
          isLight ? 'border-slate-200/60' : 'border-slate-700/50'
        }`}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className={isLight ? 'text-purple-600' : 'text-purple-400'} />
            <h2 className={`text-sm font-bold font-fantasy ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>{title}</h2>
          </div>
        </div>

        <nav className="p-3">
          <SidebarSection
            label="Interno"
            icon={ScrollText}
            items={internoItems}
            baseUrl="/admin/docs"
            section="interno"
            activeSection={activeSection}
            activeSlug={activeSlug}
            isLight={isLight}
          />
          <SidebarSection
            label="Jogador"
            icon={BookOpen}
            items={jogadorItems}
            baseUrl="/admin/docs"
            section="jogador"
            activeSection={activeSection}
            activeSlug={activeSlug}
            isLight={isLight}
          />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <DocsContent section={activeSection} slug={activeSlug} />
      </main>
    </div>
  );
}

function SidebarSection({ label, icon: Icon, items, baseUrl, section, activeSection, activeSlug, isLight }) {
  return (
    <div className="mb-4">
      <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest ${
        isLight ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <Icon size={12} />
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(item => {
          const active = activeSection === section && activeSlug === item.slug;
          const href = item.slug === 'index'
            ? `${baseUrl}/${section}`
            : `${baseUrl}/${section}/${item.slug}`;
          return (
            <Link
              key={`${section}-${item.slug}`}
              to={href}
              className={`block px-3 py-2 rounded-lg text-sm font-modern transition-all ${
                active
                  ? isLight
                    ? 'bg-purple-100/80 text-purple-700 font-medium'
                    : 'bg-purple-900/40 text-purple-300 font-medium'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
