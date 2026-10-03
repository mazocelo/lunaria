import { useState, type CSSProperties, type ComponentType, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';
import { Maximize2 } from 'lucide-react';
import ImageLightbox from '../ImageLightbox';
import { FOCO } from './foco';

interface LucideLikeIconProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

const rarityBorderColors: Record<string, string> = {
  'Comum': '#94a3b8',
  'Incomum': '#22c55e',
  'Raro': '#3b82f6',
  'Muito Raro': '#a855f7',
  'Épico': '#f97316',
  'Lendário': '#eab308',
  'Artefato': '#ef4444',
};

export interface CatalogCardAction {
  icon: ComponentType<LucideLikeIconProps>;
  label: string;
  onClick: () => void;
}

interface CatalogCardProps {
  image?: string | null;
  icon?: ComponentType<LucideLikeIconProps>;
  title: ReactNode;
  subtitle?: ReactNode;
  headerBadge?: ReactNode;
  children?: ReactNode;
  rarity?: string | null;
  actions?: CatalogCardAction[];
  onClick?: () => void;
  onImageClick?: () => void;
  delay?: number;
  className?: string;
  selecionada?: boolean;
  /** Raiz vira botão de alternar (wizard): Tab, Enter/Espaço, aria-pressed; sem onClick fica aria-disabled. */
  pressionavel?: boolean;
}

const CatalogCard = ({
  image,
  icon: Icon,
  title,
  subtitle,
  headerBadge,
  children,
  rarity,
  actions,
  onClick,
  onImageClick,
  delay = 0,
  className = '',
  selecionada = false,
  pressionavel = false,
}: CatalogCardProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const handleImageClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onImageClick) onImageClick();
    else setLightboxOpen(true);
  };
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const borderColor = rarity ? rarityBorderColors[rarity] : null;

  const cardStyle: CSSProperties = {
    animationDelay: `${delay * 50}ms`,
  };
  if (borderColor) {
    cardStyle.borderTopWidth = '3px';
    cardStyle.borderTopColor = borderColor;
  }

  const titleAlt = typeof title === 'string' ? title : '';

  return (
    <div
      onClick={onClick}
      {...(pressionavel ? {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': selecionada,
        'aria-disabled': onClick ? undefined : true,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return; // o botão "Ver imagem" interno trata o próprio teclado
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
        },
      } : {})}
      className={`
        group relative overflow-hidden rounded-xl ${pressionavel && !onClick ? 'cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-300 ease-out
        hover:-translate-y-1.5
        animate-card-reveal
        ${isLight
          ? 'bg-white/95 border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300/60'
          : 'bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500/40'
        }
        ${pressionavel ? FOCO : ''}
        ${selecionada ? 'ring-2 ring-[var(--primary)]' : ''}
        ${className}
      `}
      style={cardStyle}
    >
      {/* Image */}
      <div className="relative w-full h-44 overflow-hidden">
        {image ? (
          <>
            {/* Blurred background fill */}
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
            />
            {/* Sharp image on top */}
            <img
              src={image}
              alt={titleAlt}
              className="relative w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-110"
              loading="lazy"
            />
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isLight
              ? 'bg-gradient-to-br from-slate-50 via-purple-50/60 to-blue-50/40'
              : 'bg-gradient-to-br from-slate-800 via-purple-900/20 to-slate-800'
          }`}>
            {Icon && (
              <Icon
                size={48}
                strokeWidth={1.2}
                className={`${isLight ? 'text-purple-300/60' : 'text-purple-600/30'} transition-transform duration-500 group-hover:scale-110`}
              />
            )}
          </div>
        )}

        {/* Bottom gradient */}
        <div className={`absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t pointer-events-none ${
          isLight ? 'from-white to-transparent' : 'from-slate-800/90 to-transparent'
        }`} />

        {/* View image button */}
        {image && (
          <button
            onClick={handleImageClick}
            title="Ver imagem"
            className={`absolute top-2.5 left-2.5 z-10 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer
              opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200
              ${isLight
                ? 'bg-white/90 shadow-md hover:bg-white text-slate-500 hover:text-purple-600'
                : 'bg-slate-900/80 backdrop-blur-sm shadow-lg hover:bg-slate-800 text-slate-400 hover:text-white'
              }
            `}
          >
            <Maximize2 size={14} />
          </button>
        )}

        {/* Header badge */}
        {headerBadge && (
          <div className="absolute top-2.5 right-2.5 z-10">
            {headerBadge}
          </div>
        )}

        {/* Action buttons (hover) */}
        {actions && actions.length > 0 && (
          <div className="absolute bottom-2 right-2 z-10 flex gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            {actions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                  title={action.label}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150
                    ${isLight
                      ? 'bg-white/90 shadow-md hover:bg-white text-slate-500 hover:text-purple-600'
                      : 'bg-slate-900/80 backdrop-blur-sm shadow-lg hover:bg-slate-800 text-slate-400 hover:text-white'
                    }
                  `}
                >
                  <ActionIcon size={14} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3.5 pb-3.5 pt-1.5 space-y-1.5">
        <h3 className={`font-fantasy font-bold text-[15px] leading-snug line-clamp-1 ${
          isLight ? 'text-slate-800' : 'text-white'
        }`}>
          {title}
        </h3>

        {subtitle && (
          <p className={`text-[11px] font-modern line-clamp-2 leading-relaxed ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {subtitle}
          </p>
        )}

        {children}
      </div>

      {/* Lightbox */}
      {image && (
        <ImageLightbox
          src={image}
          alt={titleAlt}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export const CatalogCardSkeleton = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`rounded-xl overflow-hidden ${
      isLight ? 'bg-white border border-slate-200' : 'bg-slate-800/80 border border-slate-700/50'
    }`}>
      <div className={`w-full h-44 animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-700/40'}`} />
      <div className="p-3.5 space-y-2.5">
        <div className={`h-4 rounded w-3/4 animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-700/40'}`} />
        <div className={`h-3 rounded w-1/2 animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-700/40'}`} />
        <div className="flex gap-1.5">
          <div className={`h-5 w-14 rounded-full animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-700/40'}`} />
          <div className={`h-5 w-10 rounded-full animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-700/40'}`} />
        </div>
      </div>
    </div>
  );
};

interface CatalogPaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export const CatalogPagination = ({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
}: CatalogPaginationProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 font-modern text-sm ${
      isLight ? 'text-slate-500' : 'text-slate-400'
    }`}>
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`px-2 py-1 rounded-lg text-sm cursor-pointer ${
            isLight
              ? 'bg-white border border-slate-200 text-slate-700'
              : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span>de {totalCount}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1.5 rounded-lg disabled:opacity-30 cursor-pointer transition-colors ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-700'
          }`}
        >
          ‹ Anterior
        </button>
        <span className="px-3 py-1.5 font-medium">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-lg disabled:opacity-30 cursor-pointer transition-colors ${
            isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-700'
          }`}
        >
          Próxima ›
        </button>
      </div>
    </div>
  );
};

export default CatalogCard;
