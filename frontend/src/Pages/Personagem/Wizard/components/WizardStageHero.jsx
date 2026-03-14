import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, Compass, ScrollText, Sparkles } from 'lucide-react';

const STAGE_COPY = {
  boas_vindas: {
    title: 'De um nome ao seu heroi',
    description: 'Escolha um nome que combine com o tom da campanha ou peca novas sugestoes ao Mestre.',
    action: 'Defina como ele sera conhecido no mundo.'
  },
  raca: {
    title: 'Escolha a linhagem',
    description: 'A linhagem define afinidades, imaginario e boa parte da primeira impressao do personagem.',
    action: 'Selecione uma opcao abaixo ou abra o catalogo completo.'
  },
  classe: {
    title: 'Defina a vocacao',
    description: 'A classe traduz o papel do personagem em jogo: combate, suporte, exploracao ou controle.',
    action: 'Escolha a funcao que mais combina com o estilo que voce quer jogar.'
  },
  background: {
    title: 'Amarre a origem',
    description: 'O background precisa explicar de onde esse heroi veio e o que o empurra para a aventura.',
    action: 'Escreva uma origem curta ou aproveite as sugestoes do Mestre.'
  },
  vantagens: {
    title: 'Escolha os dons',
    description: 'As vantagens refinam talento, reputacao e recursos especiais.',
    action: 'Adicione apenas o que reforca a fantasia do personagem.'
  },
  desvantagens: {
    title: 'Aceite as marcas',
    description: 'Desvantagens bem escolhidas tornam o personagem mais memoravel e devolvem pontos.',
    action: 'Assuma custos que voce realmente queira interpretar.'
  },
  atributos: {
    title: 'Distribua a essencia',
    description: 'Agora voce fecha o corpo mecanico do personagem antes da criacao final.',
    action: 'Distribua todos os pontos e confirme os atributos.'
  },
  resumo: {
    title: 'Revise o destino',
    description: 'Confirme se nome, escolhas e atributos estao coerentes entre si.',
    action: 'Ajuste o que for necessario antes de criar o personagem.'
  },
  refinamento: {
    title: 'Feche os ultimos ajustes',
    description: 'Ultima checagem antes de gravar a ficha.',
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
}) => {
  const etapa = etapas?.[etapaIndex];
  const nextEtapa = etapas?.[etapaIndex + 1];
  const copy = STAGE_COPY[etapaAtual] || STAGE_COPY.boas_vindas;

  const resumo = useMemo(() => {
    const raca = racasDisponiveis?.find(item => String(item.id) === String(racaId));
    const classe = classesDisponiveis?.find(item => String(item.id) === String(classeId));

    return [
      nome?.trim() ? { label: 'Nome', value: nome.trim() } : null,
      raca ? { label: 'Linhagem', value: raca.nome } : null,
      classe ? { label: 'Vocacao', value: classe.nome } : null,
      background?.trim() ? { label: 'Origem', value: 'Definida' } : null,
      vantagensIds?.length > 0
        ? { label: 'Dons', value: `${vantagensIds.length} escolhida${vantagensIds.length > 1 ? 's' : ''}` }
        : skipVantagens
          ? { label: 'Dons', value: 'Pulados' }
          : null,
      desvantagensIds?.length > 0
        ? { label: 'Marcas', value: `${desvantagensIds.length} escolhida${desvantagensIds.length > 1 ? 's' : ''}` }
        : skipDesvantagens
          ? { label: 'Marcas', value: 'Puladas' }
          : null,
    ].filter(Boolean);
  }, [
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
  ]);

  return (
    <section
      className={`shrink-0 border-b px-4 py-4 md:px-5 md:py-4 ${
        isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-950/55'
      } backdrop-blur-sm`}
    >
      <div
        className={`rounded-2xl border px-4 py-4 md:px-5 md:py-4 ${
          isLight
            ? 'border-slate-200 bg-gradient-to-r from-white via-purple-50/70 to-indigo-50/60'
            : 'border-slate-700/50 bg-gradient-to-r from-slate-900 via-purple-950/35 to-slate-900'
        }`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${
                  isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300'
                }`}
              >
                <Sparkles size={12} />
                Etapa atual
              </span>
              <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {`Passo ${etapaIndex + 1} de ${etapas.length}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-lg font-fantasy font-bold md:text-xl ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {copy.title}
              </h2>
              {etapa?.label && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-modern font-semibold ${
                    isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {etapa.label}
                </span>
              )}
            </div>

            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {copy.description}
            </p>

            <div
              className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
                isLight ? 'border-indigo-200 bg-indigo-50/80 text-indigo-700' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200'
              }`}
            >
              <Compass size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-modern font-semibold uppercase tracking-[0.18em] opacity-80">
                  Proximo passo
                </p>
                <p className="text-sm font-modern">
                  {copy.action}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl xl:w-[26rem] xl:shrink-0">
            <div
              className={`rounded-xl border px-4 py-3 ${
                isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-900/70'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ScrollText size={15} className={isLight ? 'text-slate-500' : 'text-slate-400'} />
                  <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Estado atual
                  </span>
                </div>
                {nextEtapa && (
                  <span className={`inline-flex items-center gap-1 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <ArrowRight size={12} />
                    {nextEtapa.label}
                  </span>
                )}
              </div>

              {resumo.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resumo.map(item => (
                    <span
                      key={`${item.label}-${item.value}`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-modern ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <CheckCircle2 size={12} className="text-green-400" />
                      <span className="opacity-70">{item.label}:</span>
                      <span className="font-medium">{item.value}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nenhuma decisao fixa ainda. Comece pelo passo atual e avance etapa por etapa.
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
