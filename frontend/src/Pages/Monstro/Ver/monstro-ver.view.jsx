import React from 'react';
import { ArrowLeft, Pencil, Skull, BookOpen, ClipboardList, Heart, Swords, Shield, Zap, Tag, BarChart3, Star } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';

const RARIDADE_CONFIG = {
  'Comum': { accent: '#64748b', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', badgeLight: 'bg-gray-100 text-gray-700 border-gray-300' },
  'Incomum': { accent: '#22c55e', badge: 'bg-green-500/20 text-green-400 border-green-500/30', badgeLight: 'bg-green-100 text-green-700 border-green-300' },
  'Raro': { accent: '#3b82f6', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', badgeLight: 'bg-blue-100 text-blue-700 border-blue-300' },
  'Muito Raro': { accent: '#8b5cf6', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30', badgeLight: 'bg-purple-100 text-purple-700 border-purple-300' },
  'Lendario': { accent: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', badgeLight: 'bg-amber-100 text-amber-700 border-amber-300' },
  'Artefato': { accent: '#ef4444', badge: 'bg-red-500/20 text-red-400 border-red-500/30', badgeLight: 'bg-red-100 text-red-700 border-red-300' },
};

const getRaridadeConfig = (nome) => RARIDADE_CONFIG[nome] || RARIDADE_CONFIG['Comum'];

const formatJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return val; }
  }
  if (typeof val === 'object' && Object.keys(val).length === 0) return null;
  return val;
};

const StatRow = ({ icon: Icon, label, children, isLight }) => (
  <div className={`flex items-start gap-3 py-3 border-b border-dashed last:border-0 ${
    isLight ? 'border-slate-200/70' : 'border-slate-700/50'
  }`}>
    <Icon size={14} className={`mt-0.5 flex-shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
    <div className="flex-1 min-w-0">
      <span className={`text-[10px] uppercase tracking-widest font-modern block mb-1 ${
        isLight ? 'text-slate-400' : 'text-slate-500'
      }`}>{label}</span>
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

const AtributoBar = ({ label, value, max = 20, color, isLight }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-modern w-12 text-right ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <div className={`flex-1 h-2 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease-out' }} />
      </div>
      <span className={`text-xs font-mono font-semibold w-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>{value}</span>
    </div>
  );
};

const VerMonstroView = ({ monstro, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando monstro..." variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !monstro) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="card-rpg text-center py-12">
          <p className="text-red-400 font-modern">{error || 'Monstro nao encontrado'}</p>
          <button onClick={handleBack} className={`mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
            isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const m = monstro;
  const raridadeNome = m.raridade_rel?.nome || 'Comum';
  const config = getRaridadeConfig(raridadeNome);
  const tipos = Array.isArray(m.tipo) ? m.tipo : [];
  const elementos = Array.isArray(m.elemento) ? m.elemento : [];
  const temas = Array.isArray(m.temas) ? m.temas : [];
  const habilidades = formatJson(m.habilidades);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: config.accent }} />
        <div className={`relative p-6 md:p-8 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-white/5 border border-white/10'
              }`}>
                <Skull size={36} style={{ color: config.accent }} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className={`text-2xl md:text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {m.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? config.badgeLight : config.badge}`}>
                    {raridadeNome}
                  </span>
                  {m.categoria_rel?.nome && (
                    <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                      isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'
                    }`}>{m.categoria_rel.nome}</span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                    isLight ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-500/15 text-cyan-400'
                  }`}>Nv. {m.nivel_min}-{m.nivel_max}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={handleBack} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all duration-300 cursor-pointer ${
                isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
              }`}>
                <ArrowLeft size={16} />
                <span className="hidden md:inline">Voltar</span>
              </button>
              <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer">
                <Pencil size={16} /> Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {m.descricao && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <BookOpen size={16} className={isLight ? 'text-red-500' : 'text-red-400'} />
                Descricao
              </h3>
              <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {m.descricao}
              </p>
            </div>
          )}

          {/* Attributes */}
          <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
            style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
              isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
            }`}>
              <BarChart3 size={16} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Atributos
            </h3>
            <div className="space-y-3">
              <AtributoBar label="FOR" value={m.forca || 0} color="bg-red-500" isLight={isLight} />
              <AtributoBar label="INT" value={m.inteligencia || 0} color="bg-blue-500" isLight={isLight} />
              <AtributoBar label="DEX" value={m.destreza || 0} color="bg-green-500" isLight={isLight} />
              <AtributoBar label="CON" value={m.constituicao || 0} color="bg-amber-500" isLight={isLight} />
              <AtributoBar label="AGI" value={m.agilidade || 0} color="bg-cyan-500" isLight={isLight} />
              <AtributoBar label="CAR" value={m.carisma || 0} color="bg-pink-500" isLight={isLight} />
            </div>
          </div>

          {/* Habilidades */}
          {habilidades && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.3s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <Zap size={16} className={isLight ? 'text-amber-500' : 'text-amber-400'} />
                Habilidades
              </h3>
              {Array.isArray(habilidades) ? (
                <div className="space-y-3">
                  {habilidades.map((hab, i) => (
                    <div key={i} className={`p-3 rounded-lg ${isLight ? 'bg-slate-50' : 'bg-slate-700/30'}`}>
                      {typeof hab === 'object' ? (
                        <>
                          {hab.nome && <p className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-white'}`}>{hab.nome}</p>}
                          {hab.descricao && <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{hab.descricao}</p>}
                          {hab.dano && <p className={`text-xs font-mono mt-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Dano: {hab.dano}</p>}
                        </>
                      ) : (
                        <p className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{String(hab)}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : typeof habilidades === 'object' ? (
                <div className="space-y-2">
                  {Object.entries(habilidades).map(([key, val], i) => (
                    <p key={i} className={`font-mono text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </p>
                  ))}
                </div>
              ) : (
                <p className={`font-modern ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{String(habilidades)}</p>
              )}
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <div className={`rounded-xl overflow-hidden ${
              isLight ? 'bg-white/90 border border-slate-200' : 'bg-slate-800/60 backdrop-blur-md border border-slate-700/40'
            }`} style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className={`px-4 py-3 border-b ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <h3 className={`text-xs uppercase tracking-widest font-fantasy font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  <ClipboardList size={14} /> Ficha de Combate
                </h3>
              </div>
              <div className="px-4">
                <StatRow icon={Heart} label="HP Base" isLight={isLight}>
                  <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.hp_base}</span>
                </StatRow>

                <StatRow icon={Swords} label="Ataque Base" isLight={isLight}>
                  <span className={`font-mono font-semibold ${isLight ? 'text-orange-600' : 'text-orange-400'}`}>{m.ataque_base}</span>
                </StatRow>

                <StatRow icon={Shield} label="Defesa Base" isLight={isLight}>
                  <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{m.defesa_base}</span>
                </StatRow>

                {m.dano_base && (
                  <StatRow icon={Swords} label="Dano Base" isLight={isLight}>
                    <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{m.dano_base}</span>
                  </StatRow>
                )}

                <StatRow icon={Star} label="XP Base" isLight={isLight}>
                  <span className={`font-mono font-semibold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{m.xp_base}</span>
                </StatRow>

                <StatRow icon={BarChart3} label="Nivel" isLight={isLight}>
                  <span className="text-cyan-400 font-semibold">{m.nivel_min} - {m.nivel_max}</span>
                </StatRow>

                {tipos.length > 0 && (
                  <StatRow icon={Tag} label="Tipo" isLight={isLight}>
                    <ChipGroup items={tipos} colorClass={isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400'} />
                  </StatRow>
                )}

                {elementos.length > 0 && (
                  <StatRow icon={Zap} label="Elemento" isLight={isLight}>
                    <ChipGroup items={elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} />
                  </StatRow>
                )}

                {temas.length > 0 && (
                  <StatRow icon={Tag} label="Temas" isLight={isLight}>
                    <ChipGroup items={temas} colorClass={isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-500/15 text-indigo-400'} />
                  </StatRow>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerMonstroView;
