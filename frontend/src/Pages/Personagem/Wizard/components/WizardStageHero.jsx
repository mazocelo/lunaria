import React, { useMemo } from 'react';
import { Compass, ScrollText, Sparkles } from 'lucide-react';
import WizardReadinessSeal from './WizardReadinessSeal.jsx';

const STAGE_COPY = {
  boas_vindas: {
    title: 'Batize a centelha do heroi',
    description: 'Escolha um nome que abra caminho para o resto da identidade do personagem.',
    action: 'Defina como ele sera lembrado no mundo.'
  },
  raca: {
    title: 'Sele a linhagem',
    description: 'A linhagem define imaginario, afinidades e o primeiro impacto da ficha.',
    action: 'Escolha a origem que sustenta a fantasia base.'
  },
  classe: {
    title: 'Forje a vocacao',
    description: 'A vocacao define papel tatico, ritmo e como esse personagem atua em cena.',
    action: 'Escolha a funcao principal antes dos refinamentos.'
  },
  background: {
    title: 'Amarre a origem',
    description: 'Agora a ficha precisa de um passado que explique as marcas e ambicoes do heroi.',
    action: 'Escreva uma origem curta ou refine uma sugestao do Mestre.'
  },
  vantagens: {
    title: 'Escolha os dons',
    description: 'Os dons ampliam recursos, reputacao e versatilidade mecanica.',
    action: 'Adicione apenas o que reforca o conceito do personagem.'
  },
  desvantagens: {
    title: 'Aceite as marcas',
    description: 'Marcas bem escolhidas devolvem pontos e criam conflitos memoraveis.',
    action: 'Assuma custos que voce realmente queira interpretar.'
  },
  atributos: {
    title: 'Calibre a essencia',
    description: 'Aqui a ficha deixa de ser conceito e passa a ter proporcao mecanica real.',
    action: 'Distribua os pontos base e confirme a leitura final.'
  },
  resumo: {
    title: 'Revise o destino',
    description: 'Confirme se identidade, custo e atributos contam a mesma historia.',
    action: 'Ajuste o necessario antes de selar a ficha.'
  },
  refinamento: {
    title: 'Feche os ultimos ajustes',
    description: 'Ultima checagem ritual antes do personagem entrar no mundo.',
    action: 'Se tudo estiver consistente, conclua a criacao.'
  }
};

const WizardStageHero = ({
  etapas,
  etapaAtual,
  etapaIndex,
  nome,
  racaId,
  classeId,
  background,
  vantagensIds,
  desvantagensIds,
  skipVantagens,
  skipDesvantagens,
  racasDisponiveis,
  classesDisponiveis,
  isLight,
  readinessState = 'open',
  stageSummary,
  embedded = false,
}) => {
  const etapa = etapas?.[etapaIndex];
  const copy = STAGE_COPY[etapaAtual] || STAGE_COPY.boas_vindas;

  const resumo = useMemo(() => {
    if (stageSummary?.length) return stageSummary;

    const raca = racasDisponiveis?.find(item => String(item.id) === String(racaId));
    const classe = classesDisponiveis?.find(item => String(item.id) === String(classeId));

    return [
      nome?.trim() ? { label: 'Nome', value: nome.trim() } : null,
      raca ? { label: 'Linhagem', value: raca.nome } : null,
      classe ? { label: 'Vocacao', value: classe.nome } : null,
      background?.trim() ? { label: 'Origem', value: 'Definida' } : null,
      vantagensIds?.length > 0
        ? { label: 'Dons', value: `${vantagensIds.length} ativos` }
        : skipVantagens
          ? { label: 'Dons', value: 'Pulados' }
          : null,
      desvantagensIds?.length > 0
        ? { label: 'Marcas', value: `${desvantagensIds.length} ativas` }
        : skipDesvantagens
          ? { label: 'Marcas', value: 'Puladas' }
          : null,
    ].filter(Boolean);
  }, [stageSummary, racasDisponiveis, classesDisponiveis, racaId, classeId, nome, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens]);

  return (
    <section className={`wa-stage-enter shrink-0 ${embedded ? '' : 'px-4 pt-3 md:px-5'}`}>
      <div className={[
        embedded ? 'px-5 py-5 md:px-6' : 'wa-hero wa-etched rounded-[24px] px-4 py-4 md:px-5',
      ].filter(Boolean).join(' ')}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="wa-brass-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <Sparkles size={12} />
                Etapa atual
              </span>
              <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                Passo {etapaIndex + 1} de {etapas.length}
              </span>
              {etapa?.label && (
                <span className="wa-brass-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                  {etapa.label}
                </span>
              )}
            </div>

            <h2 className={`text-xl font-fantasy font-bold md:text-[1.55rem] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {copy.title}
            </h2>

            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
              {copy.description}
            </p>

            <div className="mt-4 flex flex-wrap items-start gap-3">
              <div className="wa-panel-soft rounded-2xl px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Compass size={15} className="mt-0.5 shrink-0 text-[var(--wa-info)]" />
                  <div>
                    <p className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                      Linha operacional
                    </p>
                    <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-700' : 'text-slate-100'}`}>{copy.action}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="w-full xl:w-[27rem] xl:shrink-0">
            <div className="wa-panel rounded-2xl px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScrollText size={15} className={isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'} />
                  <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                    Estado condensado
                  </span>
                </div>
                <WizardReadinessSeal readinessState={readinessState} compact />
              </div>

              {resumo.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resumo.map(item => (
                    <span key={`${item.label}-${item.value}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-modern ${
                      isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      <span className="opacity-65">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                  Nenhum selo fixado ainda. Comece pelo passo atual e siga etapa por etapa.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WizardStageHero;
