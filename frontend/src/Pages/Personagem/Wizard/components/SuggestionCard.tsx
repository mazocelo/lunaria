import { Sparkles, Shield, Sword, Zap } from 'lucide-react';
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;

interface TipoConfig {
  icon: IconComponent;
  label: string;
  helper: string;
  cta: string;
  accent: string;
  costClass: string;
}

export interface Sugestao {
  tipo?: string;
  id?: number | string;
  nome?: string;
  custo?: number;
  descricao?: string;
  imagem?: string | null;
  [key: string]: unknown;
}

const TIPO_CONFIG: Record<string, TipoConfig> = {
  raca: {
    icon: Sparkles,
    label: 'Linhagem',
    helper: 'Fantasia base e afinidades naturais.',
    cta: 'Fixar linhagem',
    accent: 'var(--wa-accent)',
    costClass: 'wa-accent-chip',
  },
  classe: {
    icon: Sword,
    label: 'Vocacao',
    helper: 'Papel tatico e ritmo de jogo.',
    cta: 'Fixar vocacao',
    accent: 'var(--wa-accent)',
    costClass: 'wa-accent-chip',
  },
  vantagem: {
    icon: Zap,
    label: 'Dom',
    helper: 'Expande recursos e alcance da build.',
    cta: 'Adicionar dom',
    accent: 'var(--wa-teal)',
    costClass: 'wa-teal-chip',
  },
  desvantagem: {
    icon: Shield,
    label: 'Marca',
    helper: 'Custo narrativo que devolve pontos.',
    cta: 'Assumir marca',
    accent: 'var(--wa-ember)',
    costClass: 'wa-warning-chip',
  },
};

const hasVisualImage = (sugestao: Sugestao): boolean =>
  Boolean(sugestao.imagem) && (sugestao.tipo === 'raca' || sugestao.tipo === 'classe');

interface SuggestionCardProps {
  sugestao: Sugestao;
  onSelect: (s: Sugestao) => void;
  isLight: boolean;
  selected?: boolean;
  variant?: 'default' | 'atelier';
}

const SuggestionCard = ({ sugestao, onSelect, isLight, selected = false, variant = 'default' }: SuggestionCardProps) => {
  const config = TIPO_CONFIG[sugestao.tipo || 'vantagem'] || TIPO_CONFIG.vantagem;
  const Icon = config.icon;
  const showImage = hasVisualImage(sugestao);

  if (variant !== 'atelier') {
    return (
      <button
        onClick={() => onSelect(sugestao)}
        className={`group w-full text-left rounded-xl border p-3.5 transition-all ${
          selected
            ? 'border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20'
            : isLight
              ? 'border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/50'
              : 'border-slate-700/50 bg-slate-800/30 hover:border-purple-500/30 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-start gap-3">
          {showImage ? (
            <img
              src={sugestao.imagem ?? undefined}
              alt={sugestao.nome}
              className="h-10 w-10 shrink-0 rounded-lg object-cover ring-2"
              style={{ '--tw-ring-color': `${config.accent}66` } as React.CSSProperties}
            />
          ) : (
            <div className="rounded-lg p-2" style={{ backgroundColor: isLight ? `${config.accent}18` : `${config.accent}22` }}>
              <Icon size={14} style={{ color: config.accent }} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {sugestao.nome}
                  </span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: isLight ? `${config.accent}18` : `${config.accent}22`, color: config.accent }}>
                    {config.label}
                  </span>
                </div>
                <p className={`mt-1 text-[11px] font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{config.helper}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-modern font-semibold ${selected ? 'bg-teal-500/15 text-teal-400' : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                {selected ? 'Remover' : config.cta}
              </span>
            </div>
            {sugestao.descricao && (
              <p className={`mt-2 text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{sugestao.descricao}</p>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(sugestao)}
      className={[
        'wa-choice-card wa-etched group w-full rounded-2xl border p-4 text-left',
        selected ? 'wa-choice-card--selected cursor-pointer' : 'cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {showImage ? (
          <img
            src={sugestao.imagem ?? undefined}
            alt={sugestao.nome}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 transition-transform duration-200 group-hover:scale-105"
            style={{ '--tw-ring-color': `${config.accent}66` } as React.CSSProperties}
          />
        ) : (
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border" style={{ borderColor: `${config.accent}55`, background: isLight ? `${config.accent}10` : `${config.accent}18` }}>
            <Icon size={18} style={{ color: config.accent }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {sugestao.nome}
                </span>
                <span className="wa-accent-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                  {config.label}
                </span>
                {sugestao.custo != null && (
                  <span className={`${config.costClass} rounded-full px-2 py-1 text-[10px] font-mono font-semibold`}>
                    {sugestao.custo > 0 ? `-${sugestao.custo} pts` : `+${Math.abs(sugestao.custo)} pts`}
                  </span>
                )}
              </div>
              <p className={`mt-1 text-[11px] font-modern uppercase tracking-[0.16em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                {config.helper}
              </p>
            </div>

            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold ${selected ? 'wa-teal-chip' : 'wa-panel-soft'}`}>
              {selected ? 'Remover' : config.cta}
            </span>
          </div>

          {sugestao.descricao && (
            <p className={`mt-3 text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {sugestao.descricao}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default SuggestionCard;
