import React, { useState } from 'react';
import { ArrowLeft, Pencil, BookOpen, Sparkles, ScrollText, ClipboardList, Link2, Tag, Swords, Shield, Weight, Zap, Coins, Package } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import ImageLightbox from '../../../components/ImageLightbox.jsx';

// ===================================================
// CONFIGURACAO DE RARIDADE
// ===================================================

const RARIDADE_CONFIG = {
  'Comum': {
    color: 'slate',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeLight: 'bg-gray-100 text-gray-700 border-gray-300',
    accent: '#64748b',
    glow: 'rgba(100, 116, 139, 0.2)',
    gradient: 'radial-gradient(ellipse at top, rgba(100,116,139,0.15), transparent 70%)',
  },
  'Incomum': {
    color: 'green',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    badgeLight: 'bg-green-100 text-green-700 border-green-300',
    accent: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.25)',
    gradient: 'radial-gradient(ellipse at top, rgba(34,197,94,0.2), transparent 70%)',
  },
  'Raro': {
    color: 'blue',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeLight: 'bg-blue-100 text-blue-700 border-blue-300',
    accent: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.25)',
    gradient: 'radial-gradient(ellipse at top, rgba(59,130,246,0.2), transparent 70%)',
  },
  'Muito Raro': {
    color: 'purple',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeLight: 'bg-purple-100 text-purple-700 border-purple-300',
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(139,92,246,0.25), transparent 70%)',
  },
  'Épico': {
    color: 'orange',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    badgeLight: 'bg-orange-100 text-orange-700 border-orange-300',
    accent: '#f97316',
    glow: 'rgba(249, 115, 22, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(249,115,22,0.25), transparent 70%)',
  },
  'Lendário': {
    color: 'amber',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    badgeLight: 'bg-amber-100 text-amber-700 border-amber-300',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(245,158,11,0.25), transparent 70%)',
  },
  'Variável': {
    color: 'slate',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeLight: 'bg-slate-100 text-slate-700 border-slate-300',
    accent: '#64748b',
    glow: 'rgba(100, 116, 139, 0.2)',
    gradient: 'radial-gradient(ellipse at top, rgba(100,116,139,0.15), transparent 70%)',
  },
  'Artefato': {
    color: 'red',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    badgeLight: 'bg-red-100 text-red-700 border-red-300',
    accent: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.3)',
    gradient: 'radial-gradient(ellipse at top, rgba(239,68,68,0.25), transparent 70%)',
  },
};

const getRaridadeConfig = (nome) => RARIDADE_CONFIG[nome] || RARIDADE_CONFIG['Comum'];

// ===================================================
// ICONES POR CATEGORIA
// ===================================================

const CATEGORIA_ICONS = {
  'Armas Corpo a Corpo': Swords,
  'Armas à Distância': Swords,
  'Armaduras': Shield,
  'Escudos': Shield,
  'Amuletos e Colares': Sparkles,
  'Anéis': Sparkles,
  'Poções': Zap,
  'Cajados e Varinhas': Zap,
  'Pergaminhos': ScrollText,
};

const getCategoriaIcon = (categoriaNome) => {
  return CATEGORIA_ICONS[categoriaNome] || Package;
};

// ===================================================
// HELPERS
// ===================================================

const formatJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return val; }
  }
  if (typeof val === 'object' && Object.keys(val).length === 0) return null;
  return val;
};

const formatBonusDisplay = (bonus) => {
  const parsed = formatJson(bonus);
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    return parsed.filter(b => b && typeof b === 'object').map((b) => {
      const entries = Object.entries(b);
      return entries.map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`).join(', ');
    }).filter(Boolean);
  }
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`);
  }
  return [String(parsed)];
};

const formatRequisitosDisplay = (requisitos) => {
  const parsed = formatJson(requisitos);
  if (!parsed) return null;
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`);
  }
  return [String(parsed)];
};

// ===================================================
// SUB-COMPONENTES
// ===================================================

const RarityBadge = ({ raridade, isLight, animate = false }) => {
  const config = getRaridadeConfig(raridade);
  const classes = isLight ? config.badgeLight : config.badge;

  return (
    <span
      className={`relative overflow-hidden px-3 py-1 rounded-full text-xs font-semibold border ${classes} ${animate ? 'animate-glow' : ''}`}
      style={animate ? { '--tw-shadow-color': config.glow } : undefined}
    >
      {raridade}
      {animate && (
        <span
          className="absolute inset-0 shimmer pointer-events-none"
          style={{ opacity: 0.3 }}
        />
      )}
    </span>
  );
};

const HeroCard = ({ eq, isLight, onBack, onEdit, onImageClick }) => {
  const raridadeNome = eq.raridade_rel?.nome || 'Comum';
  const config = getRaridadeConfig(raridadeNome);
  const CatIcon = getCategoriaIcon(eq.categoria_rel?.nome);

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ animation: 'fadeIn 0.6s ease-out' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: config.accent }}
      />
      <div
        className={`relative p-6 md:p-8 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
        style={!isLight ? {
          background: `${config.gradient}, rgba(30, 41, 59, 0.8)`,
          borderColor: `${config.accent}33`,
        } : undefined}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ background: config.glow, transform: 'scale(1.5)' }}
              />
              {eq.imagem ? (
                <img
                  src={eq.imagem}
                  alt={eq.nome}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: config.accent }}
                  onClick={() => onImageClick?.(eq.imagem)}
                />
              ) : (
                <div
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
                    isLight ? 'bg-slate-100' : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <CatIcon
                    size={36}
                    style={{ color: config.accent }}
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>
            <div>
              {eq.numero && (
                <span className={`font-mono text-xs mb-1 block ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  #{eq.numero}
                </span>
              )}
              <h1
                className={`text-2xl md:text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}
                style={!isLight ? { textShadow: `0 0 30px ${config.glow}` } : undefined}
              >
                {eq.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <RarityBadge raridade={raridadeNome} isLight={isLight} animate={raridadeNome !== 'Comum'} />
                {eq.categoria_rel?.nome && (
                  <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                    isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {eq.categoria_rel.nome}
                  </span>
                )}
                {eq.vinculo?.requer && (
                  <span className={`px-3 py-1 rounded-full text-xs font-modern flex items-center gap-1 ${
                    isLight ? 'bg-yellow-50 text-yellow-700' : 'bg-yellow-500/15 text-yellow-400'
                  }`}>
                    <Sparkles size={12} />
                    Vinculo Magico
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
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
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
            >
              <Pencil size={16} />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBlock = ({ eq, isLight }) => {
  const tipos = Array.isArray(eq.tipo) ? eq.tipo : [];
  const elementos = Array.isArray(eq.elemento) ? eq.elemento : [];
  const propriedades = Array.isArray(eq.propriedades) ? eq.propriedades : [];
  const bonusItems = formatBonusDisplay(eq.bonus);
  const requisitosItems = formatRequisitosDisplay(eq.requisitos);

  const StatRow = ({ icon: Icon, label, children }) => (
    <div className={`flex items-start gap-3 py-3 border-b border-dashed last:border-0 ${
      isLight ? 'border-slate-200/70' : 'border-slate-700/50'
    }`}>
      <Icon size={14} className={`mt-0.5 flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] uppercase tracking-widest font-modern block mb-1 ${
          isLight ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {label}
        </span>
        <div className={`text-sm font-modern ${isLight ? 'text-slate-800' : 'text-white'}`}>
          {children}
        </div>
      </div>
    </div>
  );

  const ChipGroup = ({ items, colorClass }) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-modern ${colorClass}`}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isLight
          ? 'bg-white/90 border border-slate-200'
          : 'bg-slate-800/60 backdrop-blur-md border border-slate-700/40'
      }`}
      style={{
        animation: 'fadeIn 0.6s ease-out',
        animationDelay: '0.2s',
        animationFillMode: 'both',
      }}
    >
      <div className={`px-4 py-3 border-b ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
      }`}>
        <h3 className={`text-xs uppercase tracking-widest font-fantasy font-bold flex items-center gap-2 ${
          isLight ? 'text-slate-600' : 'text-slate-300'
        }`}>
          <ClipboardList size={14} />
          Ficha Tecnica
        </h3>
      </div>

      <div className="px-4">
        {tipos.length > 0 && (
          <StatRow icon={Swords} label="Slot / Tipo">
            <ChipGroup
              items={tipos}
              colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'}
            />
          </StatRow>
        )}

        <StatRow icon={Tag} label="Raridade">
          <RarityBadge raridade={eq.raridade_rel?.nome || 'Comum'} isLight={isLight} />
        </StatRow>

        {eq.categoria_rel?.nome && (
          <StatRow icon={Package} label="Categoria">
            {eq.categoria_rel.nome}
          </StatRow>
        )}

        {eq.vinculo && (
          <StatRow icon={Link2} label="Vinculo Magico">
            <span className={`inline-flex items-center gap-1.5 ${
              eq.vinculo.requer
                ? (isLight ? 'text-yellow-700' : 'text-yellow-400')
                : (isLight ? 'text-slate-500' : 'text-slate-400')
            }`}>
              {eq.vinculo.requer ? (
                <><Sparkles size={12} /> Requerido</>
              ) : 'Nao requer'}
            </span>
          </StatRow>
        )}

        {elementos.length > 0 && (
          <StatRow icon={Zap} label="Elemento">
            <ChipGroup
              items={elementos}
              colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'}
            />
          </StatRow>
        )}

        {eq.dano_base && (
          <StatRow icon={Swords} label="Dano Base">
            <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>
              {eq.dano_base}
            </span>
          </StatRow>
        )}

        {propriedades.length > 0 && (
          <StatRow icon={Tag} label="Propriedades">
            <ChipGroup
              items={propriedades}
              colorClass={isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'}
            />
          </StatRow>
        )}

        {bonusItems && bonusItems.length > 0 && (
          <StatRow icon={Shield} label="Bonus">
            <div className="space-y-1">
              {bonusItems.map((b, i) => (
                <span key={i} className={`block font-mono text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {b}
                </span>
              ))}
            </div>
          </StatRow>
        )}

        {requisitosItems && requisitosItems.length > 0 && (
          <StatRow icon={Shield} label="Requisitos">
            <div className="space-y-1">
              {requisitosItems.map((r, i) => (
                <span key={i} className={`block font-mono text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  {r}
                </span>
              ))}
            </div>
          </StatRow>
        )}

        {eq.cargas && (
          <StatRow icon={Zap} label="Cargas">
            {eq.cargas}
          </StatRow>
        )}

        {eq.usos_por_dia && (
          <StatRow icon={Zap} label="Usos por Dia">
            {eq.usos_por_dia}
          </StatRow>
        )}

        {eq.peso && (
          <StatRow icon={Weight} label="Peso">
            {eq.peso} kg
          </StatRow>
        )}

        {eq.preco_sugerido && (
          <StatRow icon={Coins} label="Preco Sugerido">
            {eq.preco_sugerido}
          </StatRow>
        )}
      </div>
    </div>
  );
};

const LoreCard = ({ texto, isLight }) => {
  if (!texto) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 ${
        isLight
          ? 'bg-amber-50/50 border border-amber-200/50'
          : 'bg-amber-500/[0.03] border border-amber-500/10'
      }`}
      style={{
        borderLeft: `3px solid`,
        borderImage: 'linear-gradient(to bottom, #f59e0b, #c2410c) 1',
        animation: 'fadeIn 0.6s ease-out',
        animationDelay: '0.3s',
        animationFillMode: 'both',
      }}
    >
      <ScrollText
        size={80}
        className={`absolute -top-2 -right-2 pointer-events-none ${
          isLight ? 'text-amber-200/30' : 'text-amber-500/[0.06]'
        }`}
        strokeWidth={1}
      />
      <div className="relative z-10">
        <span className={`text-[10px] uppercase tracking-[0.2em] font-fantasy block mb-3 ${
          isLight ? 'text-amber-600/70' : 'text-amber-400/60'
        }`}>
          Origem / Lore
        </span>
        <p className={`font-modern leading-relaxed italic ${
          isLight ? 'text-slate-600' : 'text-slate-300'
        }`}>
          {texto}
        </p>
      </div>
    </div>
  );
};

const VinculoCard = ({ vinculo, isLight }) => {
  if (!vinculo?.requer) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 ${
        isLight
          ? 'bg-yellow-50/30 border border-yellow-200/50'
          : 'bg-yellow-500/[0.03] border border-yellow-500/15'
      }`}
      style={{
        boxShadow: isLight ? undefined : '0 0 25px rgba(234, 179, 8, 0.06)',
        animation: 'fadeIn 0.6s ease-out',
        animationDelay: '0.4s',
        animationFillMode: 'both',
      }}
    >
      <Sparkles
        size={70}
        className={`absolute -bottom-2 -right-2 pointer-events-none ${
          isLight ? 'text-yellow-200/40' : 'text-yellow-500/[0.06]'
        }`}
        strokeWidth={1}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 ${
            isLight ? 'text-yellow-700' : 'text-yellow-400'
          }`}>
            <Sparkles size={16} />
            Vinculo Magico
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-modern font-semibold ${
            isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            Requerido
          </span>
        </div>
        <p className={`text-xs font-modern mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Este item requer um vinculo magico com o portador para ativar seus poderes.
        </p>
        {vinculo.descricao && (
          <div className={`p-3 rounded-lg ${isLight ? 'bg-yellow-50' : 'bg-yellow-500/[0.05]'}`}>
            <span className={`text-[10px] uppercase tracking-wider font-modern block mb-1 ${
              isLight ? 'text-yellow-600/70' : 'text-yellow-500/60'
            }`}>
              Efeito do Vinculo
            </span>
            <p className={`text-sm font-modern leading-relaxed ${
              isLight ? 'text-slate-700' : 'text-white'
            }`}>
              {vinculo.descricao}
            </p>
          </div>
        )}
        {vinculo.restricao_tipo && (
          <div className={`mt-3 flex flex-wrap gap-2 text-xs font-modern ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Restricao: <strong className={isLight ? 'text-slate-700' : 'text-white'}>
              {vinculo.restricao_tipo.charAt(0).toUpperCase() + vinculo.restricao_tipo.slice(1)}
            </strong></span>
            {vinculo.restricao?.length > 0 && (
              <span>({vinculo.restricao.join(', ')})</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================
// COMPONENTE PRINCIPAL
// ===================================================

const VerEquipamentoView = ({
  equipamento,
  loading,
  error,
  isLight,
  handleBack,
  handleEdit,
}) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando equipamento..." variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !equipamento) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="card-rpg text-center py-12">
          <span className="text-4xl mb-4 block">{'X'}</span>
          <p className="text-red-400 font-modern">{error || 'Equipamento nao encontrado'}</p>
          <button
            onClick={handleBack}
            className={`mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
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

  const eq = equipamento;
  const [lightboxSrc, setLightboxSrc] = useState(null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <HeroCard
        eq={eq}
        isLight={isLight}
        onBack={handleBack}
        onImageClick={setLightboxSrc}
        onEdit={handleEdit}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {eq.descricao && (
            <div
              className={`rounded-xl p-5 ${
                isLight
                  ? 'bg-white/90 border border-slate-200'
                  : 'card-rpg'
              }`}
              style={{
                animation: 'fadeIn 0.6s ease-out',
                animationDelay: '0.1s',
                animationFillMode: 'both',
              }}
            >
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <BookOpen size={16} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                Descricao
              </h3>
              <p className={`font-modern leading-relaxed ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                {eq.descricao}
              </p>
            </div>
          )}

          <LoreCard texto={eq.origem_lore} isLight={isLight} />
          <VinculoCard vinculo={eq.vinculo} isLight={isLight} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <StatBlock eq={eq} isLight={isLight} />
          </div>
        </div>
      </div>
      <ImageLightbox src={lightboxSrc} alt={eq.nome} isOpen={!!lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
};

export default VerEquipamentoView;
