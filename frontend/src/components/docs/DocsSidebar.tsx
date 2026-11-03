import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/theme';
import { BookOpen, ChevronRight } from 'lucide-react';

export interface DocsSidebarItem {
  slug: string;
  label: string;
}

interface DocsSidebarProps {
  items: DocsSidebarItem[];
  baseUrl: string;
  title: string;
}

export default function DocsSidebar({ items, baseUrl, title }: DocsSidebarProps) {
  const { slug } = useParams<{ slug?: string }>();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
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

      <nav className="p-3 space-y-0.5">
        {items.map(item => {
          const active = slug === item.slug || (!slug && item.slug === 'index');
          return (
            <Link
              key={item.slug}
              to={item.slug === 'index' ? baseUrl : `${baseUrl}/${item.slug}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all ${
                active
                  ? isLight
                    ? 'bg-purple-100/80 text-purple-700 font-medium'
                    : 'bg-purple-900/40 text-purple-300 font-medium'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-800'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {active && <ChevronRight size={14} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
