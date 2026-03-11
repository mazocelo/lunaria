import { Sparkles, Shield, Sword, Zap } from 'lucide-react';

const TIPO_CONFIG = {
  raca: {
    icon: Sparkles,
    label: 'Raça',
    text: 'text-purple-400',
    bgLight: 'bg-purple-100',
    bgDark: 'bg-purple-500/15',
    borderSelected: 'border-purple-500/50',
    selectedLight: 'bg-purple-50',
    selectedDark: 'bg-purple-500/10',
  },
  classe: {
    icon: Sword,
    label: 'Classe',
    text: 'text-blue-400',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-500/15',
    borderSelected: 'border-blue-500/50',
    selectedLight: 'bg-blue-50',
    selectedDark: 'bg-blue-500/10',
  },
  vantagem: {
    icon: Zap,
    label: 'Vantagem',
    text: 'text-green-400',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-500/15',
    borderSelected: 'border-green-500/50',
    selectedLight: 'bg-green-50',
    selectedDark: 'bg-green-500/10',
  },
  desvantagem: {
    icon: Shield,
    label: 'Desvantagem',
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
      className={`group w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? `${config.borderSelected} ${isLight ? config.selectedLight : config.selectedDark} opacity-60 cursor-default`
          : `cursor-pointer ${isLight
            ? 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white'
            : 'border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-800/50 bg-slate-800/30'
          }`
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-md ${isLight ? config.bgLight : config.bgDark}`}>
          <Icon size={14} className={config.text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-fantasy font-bold ${
              selected
                ? isLight ? 'text-slate-500' : 'text-slate-400'
                : isLight ? 'text-slate-800' : 'text-white'
            }`}>
              {sugestao.nome}
            </span>
            {sugestao.custo != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                sugestao.custo > 0
                  ? 'bg-amber-500/15 text-amber-400'
                  : sugestao.custo < 0
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-slate-500/15 text-slate-400'
              }`}>
                {sugestao.custo > 0 ? `+${sugestao.custo}` : sugestao.custo}
              </span>
            )}
          </div>

          {sugestao.descricao && (
            <p className={`text-xs mt-0.5 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {sugestao.descricao}
            </p>
          )}
        </div>

        {selected && (
          <span className="text-green-400 text-xs font-bold">✓ Selecionado</span>
        )}
      </div>
    </button>
  );
};

export default SuggestionCard;
