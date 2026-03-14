import { Sparkles, Shield, Sword, Zap } from 'lucide-react';

const TIPO_CONFIG = {
  raca: {
    icon: Sparkles,
    label: 'Linhagem',
    helper: 'Define a fantasia base e afinidades naturais.',
    cta: 'Escolher linhagem',
    text: 'text-purple-400',
    bgLight: 'bg-purple-100',
    bgDark: 'bg-purple-500/15',
    borderSelected: 'border-purple-500/50',
    selectedLight: 'bg-purple-50',
    selectedDark: 'bg-purple-500/10',
  },
  classe: {
    icon: Sword,
    label: 'Vocacao',
    helper: 'Determina papel, ritmo e estilo de jogo.',
    cta: 'Escolher vocacao',
    text: 'text-blue-400',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-500/15',
    borderSelected: 'border-blue-500/50',
    selectedLight: 'bg-blue-50',
    selectedDark: 'bg-blue-500/10',
  },
  vantagem: {
    icon: Zap,
    label: 'Dom',
    helper: 'Amplia poder e versatilidade do personagem.',
    cta: 'Adicionar dom',
    text: 'text-green-400',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-500/15',
    borderSelected: 'border-green-500/50',
    selectedLight: 'bg-green-50',
    selectedDark: 'bg-green-500/10',
  },
  desvantagem: {
    icon: Shield,
    label: 'Marca',
    helper: 'Adiciona custo narrativo e devolve pontos.',
    cta: 'Assumir marca',
    text: 'text-red-400',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-500/15',
    borderSelected: 'border-red-500/50',
    selectedLight: 'bg-red-50',
    selectedDark: 'bg-red-500/10',
  },
};

const SuggestionCard = ({ sugestao, onSelect, isLight, selected = false }) => {
  const config = TIPO_CONFIG[sugestao.tipo] || TIPO_CONFIG.vantagem;
  const Icon = config.icon;

  return (
    <button
      onClick={() => !selected && onSelect(sugestao)}
      disabled={selected}
      className={`group w-full text-left rounded-xl border p-3.5 transition-all ${
        selected
          ? `${config.borderSelected} ${isLight ? config.selectedLight : config.selectedDark} ring-1 ${
              isLight ? 'ring-slate-200' : 'ring-slate-700/40'
            } cursor-default`
          : `cursor-pointer ${
              isLight
                ? 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                : 'border-slate-700/50 bg-slate-800/30 hover:border-purple-500/30 hover:bg-slate-800/50'
            }`
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${isLight ? config.bgLight : config.bgDark}`}>
          <Icon size={14} className={config.text} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-fantasy font-bold ${
                    selected
                      ? isLight
                        ? 'text-slate-700'
                        : 'text-slate-200'
                      : isLight
                        ? 'text-slate-800'
                        : 'text-white'
                  }`}
                >
                  {sugestao.nome}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${
                    isLight ? config.bgLight : config.bgDark
                  } ${config.text}`}
                >
                  {config.label}
                </span>
                {sugestao.custo != null && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                      sugestao.custo > 0
                        ? 'bg-amber-500/15 text-amber-400'
                        : sugestao.custo < 0
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-slate-500/15 text-slate-400'
                    }`}
                  >
                    {sugestao.custo > 0 ? `+${sugestao.custo}` : sugestao.custo} pts
                  </span>
                )}
              </div>
              <p className={`mt-1 text-[11px] font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {config.helper}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-modern font-semibold ${
                selected
                  ? 'bg-green-500/15 text-green-400'
                  : isLight
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-slate-800 text-slate-300'
              }`}
            >
              {selected ? 'Escolhida' : config.cta}
            </span>
          </div>

          {sugestao.descricao && (
            <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {sugestao.descricao}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default SuggestionCard;
