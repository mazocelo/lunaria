import React from 'react';
import { ArrowLeft, Pencil, Zap, BookOpen, ClipboardList, Swords, Tag, Shield, BarChart3, Target, Clock, Flame, Sparkles, Brain, FlaskConical } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';

const formatJson = (val) => {
  if (!val) return null;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return val; }
  }
  if (typeof val === 'object' && Object.keys(val).length === 0) return null;
  return val;
};

const formatObjectDisplay = (obj) => {
  const parsed = formatJson(obj);
  if (!parsed) return null;
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val]) => `${key}: ${val}`);
  }
  return [String(parsed)];
};

const categoriaLabels = {
  combate_fisico: 'Combate Fisico',
  combate_magico: 'Combate Magico',
  cura: 'Cura',
  suporte: 'Suporte',
  controle: 'Controle',
  invocacao: 'Invocacao',
  utilidade: 'Utilidade',
  crafting: 'Crafting',
  racial: 'Racial',
  passiva: 'Passiva',
};

const categoriaColors = {
  combate_fisico: { light: 'bg-red-100 text-red-800', dark: 'bg-red-500/20 text-red-400' },
  combate_magico: { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-500/20 text-purple-400' },
  cura: { light: 'bg-green-100 text-green-800', dark: 'bg-green-500/20 text-green-400' },
  suporte: { light: 'bg-cyan-100 text-cyan-800', dark: 'bg-cyan-500/20 text-cyan-400' },
  controle: { light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-500/20 text-amber-400' },
  invocacao: { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-500/20 text-indigo-400' },
  utilidade: { light: 'bg-slate-100 text-slate-800', dark: 'bg-slate-500/20 text-slate-400' },
  crafting: { light: 'bg-orange-100 text-orange-800', dark: 'bg-orange-500/20 text-orange-400' },
  racial: { light: 'bg-teal-100 text-teal-800', dark: 'bg-teal-500/20 text-teal-400' },
  passiva: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-500/20 text-blue-400' },
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

const VerHabilidadeView = ({ habilidade, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando habilidade..." variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !habilidade) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="card-rpg text-center py-12">
          <p className="text-red-400 font-modern">{error || 'Habilidade nao encontrada'}</p>
          <button onClick={handleBack} className={`mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
            isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const h = habilidade;
  const catColor = categoriaColors[h.categoria] || categoriaColors.utilidade;
  const efeitoItems = formatObjectDisplay(h.efeito);
  const escalamentoItems = formatObjectDisplay(h.escalamento);
  const preRequisitoItems = formatObjectDisplay(h.pre_requisito);
  const areaItems = formatObjectDisplay(h.area_efeito);
  const componenteItems = formatObjectDisplay(h.componente_material);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: '#8b5cf6' }} />
        <div className={`relative p-6 md:p-8 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-white/5 border border-white/10'
              }`}>
                <Zap size={36} className="text-purple-500" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className={`text-2xl md:text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {h.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isLight ? catColor.light : catColor.dark
                  }`}>
                    {categoriaLabels[h.categoria] || h.categoria}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                    isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'
                  }`}>{h.tipo}</span>
                  {h.elemento && (
                    <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                      isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'
                    }`}>{h.elemento}</span>
                  )}
                  {h.usa_concentracao && (
                    <span className={`px-3 py-1 rounded-full text-xs font-modern ${
                      isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/15 text-amber-400'
                    }`}>Concentracao</span>
                  )}
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
          {h.descricao && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <BookOpen size={16} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                Descricao
              </h3>
              <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {h.descricao}
              </p>
            </div>
          )}

          {efeitoItems && efeitoItems.length > 0 && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.2s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <Sparkles size={16} className={isLight ? 'text-amber-500' : 'text-amber-400'} />
                Efeito
              </h3>
              <div className="space-y-2">
                {efeitoItems.map((e, i) => (
                  <p key={i} className={`font-mono text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{e}</p>
                ))}
              </div>
            </div>
          )}

          {escalamentoItems && escalamentoItems.length > 0 && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.3s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <BarChart3 size={16} className={isLight ? 'text-cyan-500' : 'text-cyan-400'} />
                Escalamento por Nivel
              </h3>
              <div className="space-y-2">
                {escalamentoItems.map((e, i) => (
                  <p key={i} className={`font-mono text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{e}</p>
                ))}
              </div>
            </div>
          )}

          {h.receitas && h.receitas.length > 0 && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-orange-50/50 border border-orange-200/50' : 'bg-orange-500/[0.03] border border-orange-500/10'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.4s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-orange-700 border-orange-200' : 'text-orange-400 border-orange-500/20'
              }`}>
                <FlaskConical size={16} /> Receitas de Crafting ({h.receitas.length})
              </h3>
              <div className="space-y-4">
                {h.receitas.map((receita, i) => (
                  <div key={receita.id || i} className={`p-4 rounded-lg ${isLight ? 'bg-white border border-orange-200/50' : 'bg-slate-800/50 border border-orange-500/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-modern font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{receita.nome}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${isLight ? 'bg-orange-100 text-orange-700' : 'bg-orange-500/20 text-orange-400'}`}>
                        Nv. {receita.nivel_requerido || 1} | {receita.tempo_minutos || '?'}min | DC {receita.dificuldade || '?'}
                      </span>
                    </div>
                    {receita.descricao && (
                      <p className={`text-xs font-modern mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{receita.descricao}</p>
                    )}
                    {receita.ingredientes_rel?.length > 0 && (
                      <div className="mt-2">
                        <span className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ingredientes</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {receita.ingredientes_rel.map((ri, j) => (
                            <span key={j} className={`px-2 py-0.5 rounded text-[11px] font-modern ${
                              isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/15 text-green-400'
                            }`}>
                              {ri.ingrediente?.nome || `ID ${ri.ingrediente_id}`} x{ri.quantidade}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {receita.ferramentas_rel?.length > 0 && (
                      <div className="mt-2">
                        <span className={`text-[10px] uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Ferramentas</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {receita.ferramentas_rel.map((rf, j) => (
                            <span key={j} className={`px-2 py-0.5 rounded text-[11px] font-modern ${
                              isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'
                            }`}>
                              {rf.ferramenta?.nome || `ID ${rf.ferramenta_id}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className={`rounded-xl overflow-hidden ${
              isLight ? 'bg-white/90 border border-slate-200' : 'bg-slate-800/60 backdrop-blur-md border border-slate-700/40'
            }`} style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className={`px-4 py-3 border-b ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-700/50'
              }`}>
                <h3 className={`text-xs uppercase tracking-widest font-fantasy font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}>
                  <ClipboardList size={14} /> Ficha Tecnica
                </h3>
              </div>
              <div className="px-4">
                <StatRow icon={Tag} label="Categoria" isLight={isLight}>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isLight ? catColor.light : catColor.dark}`}>
                    {categoriaLabels[h.categoria] || h.categoria}
                  </span>
                </StatRow>

                <StatRow icon={Swords} label="Tipo" isLight={isLight}>
                  {h.tipo}
                </StatRow>

                <StatRow icon={BarChart3} label="Nivel Requerido" isLight={isLight}>
                  <span className="text-cyan-400 font-semibold">{h.nivel_requerido}</span>
                </StatRow>

                {h.custo_mana > 0 && (
                  <StatRow icon={Flame} label="Custo de Mana" isLight={isLight}>
                    <span className={`font-mono font-semibold ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>
                      {h.custo_mana}
                    </span>
                  </StatRow>
                )}

                {h.dano_base && (
                  <StatRow icon={Swords} label="Dano Base" isLight={isLight}>
                    <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                      {h.dano_base}
                    </span>
                  </StatRow>
                )}

                {h.elemento && (
                  <StatRow icon={Zap} label="Elemento" isLight={isLight}>
                    {h.elemento}
                  </StatRow>
                )}

                <StatRow icon={Target} label="Alvo" isLight={isLight}>
                  {h.alvo}
                </StatRow>

                <StatRow icon={Target} label="Alcance" isLight={isLight}>
                  {h.alcance}
                </StatRow>

                <StatRow icon={Clock} label="Tempo de Conjuracao" isLight={isLight}>
                  {h.tempo_conjuracao}
                </StatRow>

                {h.cooldown_turnos > 0 && (
                  <StatRow icon={Clock} label="Cooldown" isLight={isLight}>
                    {h.cooldown_turnos} turno{h.cooldown_turnos > 1 ? 's' : ''}
                  </StatRow>
                )}

                {h.usos_por_descanso && (
                  <StatRow icon={Shield} label="Usos por Descanso" isLight={isLight}>
                    {h.usos_por_descanso}
                  </StatRow>
                )}

                {h.escola_magia && (
                  <StatRow icon={Brain} label="Escola de Magia" isLight={isLight}>
                    {h.escola_magia}
                  </StatRow>
                )}

                {h.saving_throw && (
                  <StatRow icon={Shield} label="Saving Throw" isLight={isLight}>
                    {h.saving_throw}
                  </StatRow>
                )}

                {h.classe && (
                  <StatRow icon={Shield} label="Classe" isLight={isLight}>
                    {h.classe.nome}
                  </StatRow>
                )}

                {h.raca && (
                  <StatRow icon={Shield} label="Raca" isLight={isLight}>
                    {h.raca.nome}
                  </StatRow>
                )}

                {areaItems && areaItems.length > 0 && (
                  <StatRow icon={Target} label="Area de Efeito" isLight={isLight}>
                    <div className="space-y-1">
                      {areaItems.map((a, i) => (
                        <span key={i} className={`block font-mono text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{a}</span>
                      ))}
                    </div>
                  </StatRow>
                )}

                {componenteItems && componenteItems.length > 0 && (
                  <StatRow icon={Sparkles} label="Componente Material" isLight={isLight}>
                    <div className="space-y-1">
                      {componenteItems.map((c, i) => (
                        <span key={i} className={`block font-mono text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{c}</span>
                      ))}
                    </div>
                  </StatRow>
                )}

                {preRequisitoItems && preRequisitoItems.length > 0 && (
                  <StatRow icon={Shield} label="Pre-requisitos" isLight={isLight}>
                    <div className="space-y-1">
                      {preRequisitoItems.map((r, i) => (
                        <span key={i} className={`block font-mono text-xs ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{r}</span>
                      ))}
                    </div>
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

export default VerHabilidadeView;
