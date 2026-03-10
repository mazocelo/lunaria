import React from 'react';
import { ArrowLeft, Pencil, Dna, BookOpen, ClipboardList, Coins, Zap } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';

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
      return Object.entries(b).map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`).join(', ');
    }).filter(Boolean);
  }
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val]) => `${key}: ${val > 0 ? '+' : ''}${val}`);
  }
  return [String(parsed)];
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

const VerRacaView = ({ raca, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando raca..." variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !raca) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="card-rpg text-center py-12">
          <p className="text-red-400 font-modern">{error || 'Raca nao encontrada'}</p>
          <button onClick={handleBack} className={`mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
            isLight ? 'border border-slate-300 text-slate-600 hover:bg-slate-50' : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }`}>
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>
    );
  }

  const bonusItems = formatBonusDisplay(raca.bonus);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-xl" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: '#06b6d4' }} />
        <div className={`relative p-6 md:p-8 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-slate-100' : 'bg-white/5 border border-white/10'
              }`}>
                <Dna size={36} className="text-cyan-500" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className={`text-2xl md:text-4xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {raca.nome}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    raca.custo === 0
                      ? (isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400')
                      : (isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400')
                  }`}>
                    {raca.custo === 0 ? 'Gratuita' : `${raca.custo} pts`}
                  </span>
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
          {raca.descricao && (
            <div className={`rounded-xl p-5 ${isLight ? 'bg-white/90 border border-slate-200' : 'card-rpg'}`}
              style={{ animation: 'fadeIn 0.6s ease-out', animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h3 className={`text-sm font-fantasy font-bold flex items-center gap-2 mb-4 pb-3 border-b ${
                isLight ? 'text-slate-600 border-slate-200' : 'text-slate-300 border-slate-700/50'
              }`}>
                <BookOpen size={16} className={isLight ? 'text-cyan-500' : 'text-cyan-400'} />
                Descricao
              </h3>
              <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {raca.descricao}
              </p>
            </div>
          )}
        </div>

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
                  <ClipboardList size={14} /> Ficha Tecnica
                </h3>
              </div>
              <div className="px-4">
                <StatRow icon={Coins} label="Custo" isLight={isLight}>
                  <span className={`font-mono font-semibold ${
                    raca.custo === 0 ? (isLight ? 'text-green-600' : 'text-green-400') : (isLight ? 'text-amber-600' : 'text-amber-400')
                  }`}>
                    {raca.custo === 0 ? 'Gratuita' : `${raca.custo} pontos`}
                  </span>
                </StatRow>
                {bonusItems && bonusItems.length > 0 && (
                  <StatRow icon={Zap} label="Bonus" isLight={isLight}>
                    <div className="space-y-1">
                      {bonusItems.map((b, i) => (
                        <span key={i} className={`block font-mono text-xs ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{b}</span>
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

export default VerRacaView;
