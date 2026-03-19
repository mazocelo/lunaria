import React, { useState } from 'react';
import { ArrowLeft, Pencil, ClipboardList, AlertTriangle, Maximize2 } from 'lucide-react';
import { useTheme } from '../../contexts/theme.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import ImageLightbox from '../ImageLightbox.jsx';
import { getRaridadeConfig, StatRow } from './catalogDetailHelpers.jsx';

// ===================================================
// CATALOG DETAIL LAYOUT — "Vitral Arcano" Theme
// ===================================================

const CatalogDetailLayout = ({
  title,
  subtitle,
  image,
  icon: Icon,
  accentColor = '#8b5cf6',
  rarity,
  badges,

  sections,

  sidebarTitle = 'Ficha Técnica',
  sidebarIcon: SidebarIcon = ClipboardList,
  stats,

  onBack,
  onEdit,
  extraActions,

  loading = false,
  loadingText = 'Carregando...',
  error,

  children,
  afterSidebar,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const rarityConfig = rarity ? getRaridadeConfig(rarity) : null;
  const effectiveAccent = rarityConfig?.accent || accentColor;
  const rgb = hexToRgb(effectiveAccent);

  // Loading
  if (loading) {
    return (
      <div className="animate-fade-in max-w-7xl mx-auto">
        <div className="card-rpg flex items-center justify-center py-20">
          <LoadingSpinner size="xl" text={loadingText} variant="primary" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="animate-fade-in max-w-7xl mx-auto">
        <div className={`rounded-xl text-center py-12 px-6 ${
          isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'
        }`}>
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400 opacity-60" />
          <p className={`font-modern text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>{error}</p>
          <button onClick={onBack} className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
            isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const hasSidebar = (stats && stats.length > 0) || afterSidebar;
  const hasSections = sections && sections.length > 0;

  // -------------------------------------------------
  // HERO — Large, impactful
  // -------------------------------------------------
  const renderHero = () => (
    <div className="relative overflow-hidden rounded-2xl" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* Top accent bar — thicker */}
      <div className="absolute top-0 left-0 right-0 h-1 z-20" style={{ background: `linear-gradient(90deg, ${effectiveAccent}, ${effectiveAccent}88, ${effectiveAccent})` }} />

      {/* Background image — large blurred */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" aria-hidden="true" className="w-full h-full object-cover scale-110 blur-2xl" style={{ opacity: isLight ? 0.15 : 0.25 }} />
          <div className={`absolute inset-0 ${isLight ? 'bg-white/70' : 'bg-slate-900/60'}`} />
        </div>
      )}

      <div
        className={`relative p-6 md:p-8 ${!image ? (isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg') : ''}`}
        style={!isLight && rarityConfig && !image ? {
          background: `${rarityConfig.gradient}, rgba(30, 41, 59, 0.8)`,
          borderColor: `${effectiveAccent}33`,
        } : undefined}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Image + Title */}
          <div className="flex items-start gap-5 min-w-0">
            {/* Image container — larger */}
            <div className="relative flex-shrink-0 group">
              {/* Glow halo — stronger */}
              <div className="absolute inset-0 rounded-2xl blur-2xl" style={{
                background: rarityConfig?.glow || `rgba(${rgb}, 0.4)`,
                transform: 'scale(1.6)',
                opacity: isLight ? 0.5 : 0.8,
              }} />

              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt={title}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    style={{
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: effectiveAccent,
                      boxShadow: `0 0 20px rgba(${rgb}, 0.3), 0 4px 16px rgba(0,0,0,0.2)`,
                    }}
                    onClick={() => setLightboxOpen(true)}
                    draggable={false}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                    className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      ${isLight ? 'bg-white/90 shadow-md text-slate-500' : 'bg-slate-900/80 backdrop-blur-sm shadow-lg text-slate-300'}
                    `}
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              ) : (
                <div
                  className={`relative w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center ${
                    isLight ? 'bg-slate-100 border-2 border-slate-200' : 'bg-white/5 border-2 border-white/10'
                  }`}
                  style={{ borderColor: `rgba(${rgb}, 0.3)` }}
                >
                  <Icon size={48} style={{ color: effectiveAccent }} strokeWidth={1.2} />
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div className="min-w-0 pt-1">
              {subtitle && (
                <span className={`font-mono text-xs mb-1.5 block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {subtitle}
                </span>
              )}
              <h1
                className={`text-3xl md:text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}
                style={!isLight ? { textShadow: `0 0 40px rgba(${rgb}, 0.4)` } : undefined}
              >
                {title}
              </h1>
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {badges.map((badge, i) => <React.Fragment key={i}>{badge}</React.Fragment>)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0 pt-1">
            {extraActions}
            <button onClick={onBack} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all duration-300 cursor-pointer ${
              isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}>
              <ArrowLeft size={16} />
              <span className="hidden md:inline">Voltar</span>
            </button>
            {onEdit && (
              <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer">
                <Pencil size={16} /> Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------
  // VITRAL SECTION — Rich, colorful
  // -------------------------------------------------
  const renderSection = (section, index) => {
    const delay = section.delay ?? (index + 1) * 100;
    const sectionColor = section.color || effectiveAccent;
    const sRgb = hexToRgb(sectionColor);
    const SectionIcon = section.icon;

    return (
      <div
        key={index}
        className={`vitral-section relative overflow-hidden rounded-xl ${
          isLight ? '' : 'backdrop-blur-sm'
        }`}
        style={{
          '--vitral-accent': sectionColor,
          background: isLight
            ? `linear-gradient(135deg, rgba(${sRgb}, 0.08), rgba(${sRgb}, 0.02))`
            : `linear-gradient(135deg, rgba(${sRgb}, 0.1), rgba(${sRgb}, 0.02))`,
          border: `1px solid rgba(${sRgb}, ${isLight ? '0.2' : '0.15'})`,
          borderLeftWidth: '3px',
          borderLeftColor: sectionColor,
          animation: 'fadeIn 0.6s ease-out both',
          animationDelay: `${delay}ms`,
        }}
      >
        {/* Decorative background icon */}
        {SectionIcon && (
          <SectionIcon
            size={120}
            className="absolute -top-4 -right-4 pointer-events-none"
            strokeWidth={0.5}
            style={{ color: sectionColor, opacity: isLight ? 0.06 : 0.04 }}
          />
        )}

        <div className="relative z-10">
          <h3 className="text-sm font-fantasy font-bold flex items-center gap-2.5 mb-4 pb-3"
            style={{ borderBottom: `1px solid rgba(${sRgb}, ${isLight ? '0.15' : '0.12'})` }}
          >
            {SectionIcon && (
              <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `rgba(${sRgb}, ${isLight ? '0.12' : '0.15'})` }}
              >
                <SectionIcon size={14} style={{ color: sectionColor }} />
              </span>
            )}
            <span style={{ color: sectionColor }}>{section.title}</span>
          </h3>
          {section.content}
        </div>
      </div>
    );
  };

  // -------------------------------------------------
  // SIDEBAR — Glass with accent glow
  // -------------------------------------------------
  const renderSidebar = () => (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6 space-y-6">
        {stats && stats.length > 0 && (
          <div
            className={`rounded-xl overflow-hidden ${
              isLight
                ? 'bg-white/95 border border-slate-200'
                : 'bg-slate-800/70 backdrop-blur-md border border-slate-700/40'
            }`}
            style={{
              borderTopWidth: '3px',
              borderTopColor: effectiveAccent,
              boxShadow: isLight
                ? `0 4px 24px rgba(${rgb}, 0.08)`
                : `0 4px 24px rgba(${rgb}, 0.12), 0 0 40px rgba(${rgb}, 0.05)`,
              animation: 'fadeIn 0.6s ease-out both',
              animationDelay: '200ms',
            }}
          >
            {/* Sidebar header — accent tinted */}
            <div className="px-4 py-3.5 border-b"
              style={{
                background: isLight
                  ? `linear-gradient(135deg, rgba(${rgb}, 0.06), transparent)`
                  : `linear-gradient(135deg, rgba(${rgb}, 0.1), transparent)`,
                borderColor: isLight ? `rgba(${rgb}, 0.1)` : `rgba(${rgb}, 0.08)`,
              }}
            >
              <h3 className="text-xs uppercase tracking-widest font-fantasy font-bold flex items-center gap-2"
                style={{ color: effectiveAccent }}
              >
                <SidebarIcon size={14} />
                {sidebarTitle}
              </h3>
            </div>

            <div className="px-4">
              {stats.map((stat, i) => (
                <StatRow key={i} icon={stat.icon} label={stat.label} isLight={isLight}>
                  {stat.content}
                </StatRow>
              ))}
            </div>
          </div>
        )}
        {afterSidebar}
      </div>
    </div>
  );

  // -------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {renderHero()}

      {(hasSections || children || hasSidebar) && (
        <div className={`grid gap-6 ${hasSidebar ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {(hasSections || children) && (
            <div className={`space-y-6 ${hasSidebar ? 'lg:col-span-2' : ''}`}>
              {hasSections && sections.map((section, i) => renderSection(section, i))}
              {children}
            </div>
          )}
          {hasSidebar && renderSidebar()}
        </div>
      )}

      {image && (
        <ImageLightbox src={image} alt={title} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
};

function hexToRgb(hex) {
  if (!hex || hex.charAt(0) !== '#') return '139, 92, 246';
  const bigint = parseInt(hex.slice(1), 16);
  if (isNaN(bigint)) return '139, 92, 246';
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

export default CatalogDetailLayout;
