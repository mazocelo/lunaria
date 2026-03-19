import React, { useState } from 'react';
import { ArrowLeft, Pencil, ClipboardList, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/theme.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import ImageLightbox from '../ImageLightbox.jsx';
import { getRaridadeConfig, StatRow } from './catalogDetailHelpers.jsx';

// ===================================================
// CATALOG DETAIL LAYOUT — "Vitral Arcano" Theme
// ===================================================

const CatalogDetailLayout = ({
  // Content
  title,
  subtitle,
  image,
  icon: Icon,
  accentColor = '#8b5cf6',
  rarity,
  badges,

  // Main content sections
  sections,

  // Sidebar
  sidebarTitle = 'Ficha Técnica',
  sidebarIcon: SidebarIcon = ClipboardList,
  stats,

  // Actions
  onBack,
  onEdit,
  extraActions,

  // State
  loading = false,
  loadingText = 'Carregando...',
  error,

  // Slots
  children,
  afterSidebar,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const rarityConfig = rarity ? getRaridadeConfig(rarity) : null;
  const effectiveAccent = rarityConfig?.accent || accentColor;

  // -------------------------------------------------
  // Loading state
  // -------------------------------------------------
  if (loading) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="card-rpg flex items-center justify-center py-20">
          <LoadingSpinner size="xl" text={loadingText} variant="primary" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // Error state
  // -------------------------------------------------
  if (error) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className={`rounded-xl text-center py-12 px-6 ${
          isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'
        }`}>
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-400 opacity-60" />
          <p className={`font-modern text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>
            {error}
          </p>
          <button
            onClick={onBack}
            className={`mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
              isLight
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------
  // Render helpers
  // -------------------------------------------------

  const hasSidebar = (stats && stats.length > 0) || afterSidebar;
  const hasSections = sections && sections.length > 0;

  // -------------------------------------------------
  // HERO SECTION
  // -------------------------------------------------
  const renderHero = () => (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ animation: 'fadeIn 0.6s ease-out' }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-10"
        style={{ background: effectiveAccent }}
      />

      <div
        className={`relative p-6 md:p-8 ${
          isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'
        }`}
        style={!isLight && rarityConfig ? {
          background: `${rarityConfig.gradient}, rgba(30, 41, 59, 0.8)`,
          borderColor: `${effectiveAccent}33`,
        } : undefined}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Image/Icon + Title + Badges */}
          <div className="flex items-center gap-5 min-w-0">
            {/* Image / Icon container */}
            <div className="relative flex-shrink-0">
              {/* Blurred glow halo */}
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{
                  background: rarityConfig?.glow || `${effectiveAccent}40`,
                  transform: 'scale(1.5)',
                }}
              />

              {image ? (
                <img
                  src={image}
                  alt={title}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain border-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: effectiveAccent }}
                  onClick={() => setLightboxOpen(true)}
                  draggable={false}
                />
              ) : (
                <div
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
                    isLight ? 'bg-slate-100' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <Icon size={36} style={{ color: effectiveAccent }} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div className="min-w-0">
              {subtitle && (
                <span className={`font-mono text-xs mb-1 block ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {subtitle}
                </span>
              )}
              <h1
                className={`text-2xl md:text-4xl font-fantasy font-bold truncate ${
                  isLight ? 'text-slate-800' : 'text-white'
                }`}
                style={!isLight && rarityConfig ? { textShadow: `0 0 30px ${rarityConfig.glow}` } : undefined}
              >
                {title}
              </h1>
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {badges.map((badge, i) => (
                    <React.Fragment key={i}>{badge}</React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {extraActions}
            <button
              onClick={onBack}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all duration-300 cursor-pointer ${
                isLight
                  ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                  : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <ArrowLeft size={16} />
              <span className="hidden md:inline">Voltar</span>
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
              >
                <Pencil size={16} />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------
  // VITRAL SECTION
  // -------------------------------------------------
  const renderSection = (section, index) => {
    const delay = section.delay ?? (index + 1) * 100;
    const sectionColor = section.color || effectiveAccent;

    // Build tint background
    const tintBg = isLight
      ? `rgba(${hexToRgb(sectionColor)}, 0.04)`
      : `rgba(${hexToRgb(sectionColor)}, 0.03)`;

    const borderBg = isLight
      ? `rgba(${hexToRgb(sectionColor)}, 0.2)`
      : `rgba(${hexToRgb(sectionColor)}, 0.15)`;

    return (
      <div
        key={index}
        className={`vitral-section ${
          isLight
            ? 'border border-slate-200/80'
            : 'border border-slate-700/40'
        }`}
        style={{
          '--vitral-accent': sectionColor,
          background: tintBg,
          borderColor: borderBg,
          animation: 'fadeIn 0.6s ease-out both',
          animationDelay: `${delay}ms`,
        }}
      >
        <div className="relative z-10">
          <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
            isLight ? 'border-slate-200/70' : 'border-slate-700/40'
          }`}>
            {section.icon && (
              <section.icon size={16} style={{ color: sectionColor }} />
            )}
            <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>
              {section.title}
            </span>
          </h3>
          {section.content}
        </div>
      </div>
    );
  };

  // -------------------------------------------------
  // SIDEBAR
  // -------------------------------------------------
  const renderSidebar = () => (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6 space-y-6">
        {stats && stats.length > 0 && (
          <div
            className={`rounded-xl overflow-hidden ${
              isLight
                ? 'bg-white/90 border border-slate-200'
                : 'bg-slate-800/60 backdrop-blur-md border border-slate-700/40'
            }`}
            style={{
              borderTopColor: effectiveAccent,
              borderTopWidth: '2px',
              animation: 'fadeIn 0.6s ease-out both',
              animationDelay: '200ms',
            }}
          >
            {/* Sidebar header */}
            <div className={`px-4 py-3 border-b ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
            }`}>
              <h3 className={`text-xs uppercase tracking-widest font-fantasy font-bold flex items-center gap-2 ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                <SidebarIcon size={14} />
                {sidebarTitle}
              </h3>
            </div>

            {/* Stat rows */}
            <div className="px-4">
              {stats.map((stat, i) => (
                <StatRow
                  key={i}
                  icon={stat.icon}
                  label={stat.label}
                  isLight={isLight}
                >
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
    <div className="max-w-5xl mx-auto space-y-6">
      {renderHero()}

      {(hasSections || children || hasSidebar) && (
        <div className={`grid gap-6 ${
          hasSidebar ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
        }`}>
          {/* Main column */}
          {(hasSections || children) && (
            <div className={`space-y-6 ${hasSidebar ? 'lg:col-span-2' : ''}`}>
              {hasSections && sections.map((section, i) => renderSection(section, i))}
              {children}
            </div>
          )}

          {/* Sidebar column */}
          {hasSidebar && renderSidebar()}
        </div>
      )}

      {/* Lightbox */}
      {image && (
        <ImageLightbox
          src={image}
          alt={title}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};

// ===================================================
// UTILITY: hex color to r,g,b string
// ===================================================
function hexToRgb(hex) {
  if (!hex || hex.charAt(0) !== '#') return '139, 92, 246';
  const bigint = parseInt(hex.slice(1), 16);
  if (isNaN(bigint)) return '139, 92, 246';
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export default CatalogDetailLayout;
