import React from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';

const STAGE_COPY = {
  boas_vindas: { title: 'Batize a centelha do heroi', description: 'Escolha um nome que abra caminho para o resto da identidade do personagem.' },
  raca: { title: 'Sele a linhagem', description: 'A linhagem define imaginario, afinidades e o primeiro impacto da ficha.' },
  classe: { title: 'Forje a vocacao', description: 'A vocacao define papel tatico, ritmo e como esse personagem atua em cena.' },
  background: { title: 'Amarre a origem', description: 'Agora a ficha precisa de um passado que explique as marcas e ambicoes do heroi.' },
  vantagens: { title: 'Escolha os dons', description: 'Os dons ampliam recursos, reputacao e versatilidade mecanica.' },
  desvantagens: { title: 'Aceite as marcas', description: 'Marcas bem escolhidas devolvem pontos e criam conflitos memoraveis.' },
  atributos: { title: 'Calibre a essencia', description: 'Aqui a ficha deixa de ser conceito e passa a ter proporcao mecanica real.' },
  resumo: { title: 'Revise o destino', description: 'Confirme se identidade, custo e atributos contam a mesma historia.' },
  refinamento: { title: 'Feche os ultimos ajustes', description: 'Ultima checagem ritual antes do personagem entrar no mundo.' },
};

const WizardProgressBar = ({
  etapas,
  etapaIndex,
  isLight,
  onEtapaClick,
  etapasConcluidas = [],
  etapasVisitadas = [],
  tooltipMap = {},
  onBack,
  onToggleFicha,
  fichaAberta = false,
  embedded = false,
  pontosCriacaoRestantes,
  pontosCriacaoTotal,
  pontosDistribuidos,
  pontosTotais,
  pontosRestantes,
}) => {
  const progresso = ((etapaIndex + 1) / etapas.length) * 100;
  const etapaAtual = etapas[etapaIndex];
  const copy = STAGE_COPY[etapaAtual?.id] || STAGE_COPY.boas_vindas;

  return (
    <div className={embedded ? 'px-5 py-4 md:px-6' : 'wa-progress-rail mx-4 mt-4 rounded-2xl px-4 py-3 md:mx-5 md:mt-5 md:px-5'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-300 bg-white/70 text-slate-600 hover:bg-white'
                  : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-900'
              }`}
              aria-label="Voltar para personagens"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <span className={`shrink-0 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
            {`${etapaIndex + 1}/${etapas.length}`}
          </span>
          <span className={`shrink-0 text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {copy.title}
          </span>
          <span className={`hidden sm:inline text-xs font-modern ${isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'}`}>—</span>
          <p className={`hidden sm:block min-w-0 truncate text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
            {copy.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {['vantagens', 'desvantagens'].includes(etapaAtual?.id) && pontosCriacaoTotal != null && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold ${
              pontosCriacaoRestantes <= 0 ? 'wa-ember-chip' : 'wa-accent-chip'
            }`}>
              {pontosCriacaoRestantes}/{pontosCriacaoTotal} pts
            </span>
          )}
          {etapaAtual?.id === 'atributos' && pontosTotais != null && (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-mono font-semibold ${
              pontosRestantes === 0 ? 'wa-emerald-chip' : 'wa-accent-chip'
            }`}>
              {pontosDistribuidos}/{pontosTotais} pts
            </span>
          )}
        </div>

        {onToggleFicha && (
          <button
            type="button"
            onClick={onToggleFicha}
            className={`xl:hidden inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-modern font-semibold transition-all cursor-pointer ${
              fichaAberta
                ? 'wa-forge-chip'
                : isLight
                  ? 'border-slate-300 bg-white/70 text-slate-600 hover:bg-white'
                  : 'border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ScrollText size={13} />
            Ficha
            {fichaAberta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      <div className={`relative mb-4 h-2 rounded-full ${isLight ? 'bg-slate-200/90' : 'bg-slate-800/80'}`}>
        <div className="wa-progress-shimmer absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--wa-accent)] via-[var(--wa-accent-bright)] to-[var(--wa-teal)] transition-all duration-500" style={{ width: `${progresso}%` }} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {etapas.map((etapa, i) => {
          const isActive = i === etapaIndex;
          const isConcluida = etapasConcluidas.includes(etapa.id);
          const isVisitada = etapasVisitadas.includes(etapa.id);
          const isFuture = !isActive && !isConcluida && !isVisitada;
          const isClickable = isConcluida && !isActive && !!onEtapaClick;
          const tooltip = tooltipMap?.[etapa.id];

          return (
            <button
              key={etapa.id}
              type="button"
              title={tooltip ? `${etapa.label}: ${tooltip}` : etapa.label}
              onClick={isClickable ? () => onEtapaClick(etapa.id) : undefined}
              disabled={!isClickable}
              className={[
                'wa-rune-step group inline-flex min-w-fit items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-modern transition-all',
                isActive ? 'is-active' : '',
                isConcluida ? 'is-complete' : '',
                isVisitada && !isConcluida && !isActive ? 'is-visited' : '',
                isFuture ? 'is-future' : '',
                isClickable ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default',
              ].filter(Boolean).join(' ')}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
                isActive
                  ? 'border-[var(--wa-accent)] text-[var(--wa-accent)]'
                  : isConcluida
                    ? 'border-[var(--wa-teal)] text-[var(--wa-teal)]'
                    : isLight
                      ? 'border-slate-300 text-slate-500'
                      : 'border-slate-700 text-slate-500'
              }`}>
                {isConcluida ? <Check size={12} /> : <span className="text-[12px]">{etapa.icon}</span>}
              </span>
              <span className="whitespace-nowrap">{etapa.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;
