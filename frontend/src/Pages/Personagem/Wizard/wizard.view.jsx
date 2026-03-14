import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Trash2,
  X,
  ArrowRight,
  Check,
  Save,
  Loader2,
  Sparkles,
  Hammer,
} from 'lucide-react';
import './wizard-theme.css';
import WizardProgressBar from './components/WizardProgressBar.jsx';
import WizardChat from './components/WizardChat.jsx';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard.jsx';

const FOOTER_COPY = {
  boas_vindas: 'Fixe o nome do heroi e abra a trilha da identidade.',
  raca: 'Sele a linhagem que sustenta a fantasia base do personagem.',
  classe: 'Escolha a vocacao que define o papel do heroi em cena.',
  background: 'Amarre a origem antes de seguir para os refinamentos.',
  vantagens: 'Escolha apenas os dons que reforcam o conceito.',
  desvantagens: 'Assuma marcas que voce queira interpretar em jogo.',
  atributos: 'Calibre os atributos e confirme a leitura mecanica da build.',
  resumo: 'Revise tudo e feche a ficha com coerencia.',
  refinamento: 'Ultima checagem antes de selar o personagem.',
};

const getResumoTexto = ({ done, skipped, doneText, skippedText, pendingText }) => {
  if (done) return doneText;
  if (skipped) return skippedText;
  return pendingText;
};

const WizardView = (props) => {
  const {
    etapas,
    etapaAtual,
    etapaIndex,
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    atributosSugeridos,
    chatEndRef,
    nome,
    racaId,
    classeId,
    atributosBase,
    atributosFinal,
    vantagensIds,
    desvantagensIds,
    pontosDistribuidos,
    pontosRestantes,
    pontosTotais,
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,
    enviarMensagem,
    selecionarSugestao,
    removerSelecao,
    aplicarAtributosSugeridos,
    setAtributo,
    confirmarAtributos,
    salvarPersonagem,
    avancarComMestre,
    pularEtapa,
    navegarParaEtapa,
    clearError,
    bonusAplicados,
    bonusDetalhes,
    bonusInvalidado,
    skipVantagens,
    skipDesvantagens,
    background,
    draftRestaurado,
    descartarDraft,
    etapasConcluidas,
    etapasVisitadas,
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    pontosVantagem,
    pontosDesvantagem,
    custoRaca,
    custoClasse,
    pontosGastos,
    maxCustoDesvantagem,
    attrMin,
    attrMax,
    salvando,
    gerandoBackground,
    error,
    isLight,
    navigate,
  } = props;

  const [fichaAberta, setFichaAberta] = useState(false);

  const allSelecoes = useMemo(() => [...vantagensIds, ...desvantagensIds], [vantagensIds, desvantagensIds]);
  const etapaAtualObj = etapas[etapaIndex];
  const proximaEtapa = etapas[etapaIndex + 1];

  const racaAtual = useMemo(
    () => racasDisponiveis.find(item => String(item.id) === String(racaId)),
    [racasDisponiveis, racaId],
  );

  const classeAtual = useMemo(
    () => classesDisponiveis.find(item => String(item.id) === String(classeId)),
    [classesDisponiveis, classeId],
  );



  const podeCriar = !!(nome?.trim() && racaId && classeId && background?.trim() && bonusAplicados);
  const pendenciasOpcionais = Number(vantagensIds.length === 0 && !skipVantagens) + Number(desvantagensIds.length === 0 && !skipDesvantagens);
  const pendingCount = [!nome?.trim(), !racaId, !classeId, !background?.trim(), !bonusAplicados].filter(Boolean).length + pendenciasOpcionais;

  const readinessState = useMemo(() => {
    if (!nome?.trim() || !racaId || !classeId) return 'open';
    if (pendingCount > 0 || bonusInvalidado) return 'shaping';
    return 'sealed';
  }, [nome, racaId, classeId, pendingCount, bonusInvalidado]);

  const footerHint = FOOTER_COPY[etapaAtual] || 'Avance para a proxima etapa da forja.';

  const progressoItems = useMemo(() => ([
    { label: 'Nome', done: !!nome?.trim(), skipped: false },
    { label: 'Linhagem', done: !!racaId, skipped: false },
    { label: 'Vocacao', done: !!classeId, skipped: false },
    { label: 'Origem', done: !!background?.trim(), skipped: false },
    { label: 'Dons', done: vantagensIds.length > 0 || skipVantagens, skipped: skipVantagens },
    { label: 'Marcas', done: desvantagensIds.length > 0 || skipDesvantagens, skipped: skipDesvantagens },
    { label: 'Atributos', done: bonusAplicados, skipped: false },
  ]), [nome, racaId, classeId, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens, bonusAplicados]);

  const tooltipMap = useMemo(() => ({
    boas_vindas: nome?.trim() || 'Nome pendente',
    raca: racaAtual?.nome || 'Linhagem pendente',
    classe: classeAtual?.nome || 'Vocacao pendente',
    background: background?.trim() ? 'Origem definida' : 'Origem pendente',
    vantagens: getResumoTexto({
      done: vantagensIds.length > 0,
      skipped: skipVantagens,
      pending: vantagensIds.length === 0 && !skipVantagens,
      doneText: `${vantagensIds.length} dons fixados`,
      skippedText: 'Etapa pulada',
      pendingText: 'Dons pendentes',
    }),
    desvantagens: getResumoTexto({
      done: desvantagensIds.length > 0,
      skipped: skipDesvantagens,
      pending: desvantagensIds.length === 0 && !skipDesvantagens,
      doneText: `${desvantagensIds.length} marcas fixadas`,
      skippedText: 'Etapa pulada',
      pendingText: 'Marcas pendentes',
    }),
    atributos: bonusAplicados ? 'Calibrados e confirmados' : bonusInvalidado ? 'Revisao necessaria' : 'Leitura pendente',
    resumo: podeCriar ? 'Pronto para selar' : 'Revisao em andamento',
    refinamento: podeCriar ? 'Selo final disponivel' : 'Ajustes restantes',
  }), [
    nome,
    racaAtual,
    classeAtual,
    background,
    vantagensIds,
    skipVantagens,
    desvantagensIds,
    skipDesvantagens,
    bonusAplicados,
    bonusInvalidado,
    podeCriar,
  ]);

  const stageSummary = useMemo(() => ([
    nome?.trim() ? { label: 'Nome', value: nome.trim() } : null,
    racaAtual?.nome ? { label: 'Linhagem', value: racaAtual.nome } : null,
    classeAtual?.nome ? { label: 'Vocacao', value: classeAtual.nome } : null,
    background?.trim() ? { label: 'Origem', value: 'Definida' } : null,
    vantagensIds.length > 0
      ? { label: 'Dons', value: `${vantagensIds.length} ativos` }
      : skipVantagens
        ? { label: 'Dons', value: 'Pulados' }
        : null,
    desvantagensIds.length > 0
      ? { label: 'Marcas', value: `${desvantagensIds.length} ativas` }
      : skipDesvantagens
        ? { label: 'Marcas', value: 'Puladas' }
        : null,
  ].filter(Boolean)), [nome, racaAtual, classeAtual, background, vantagensIds, skipVantagens, desvantagensIds, skipDesvantagens]);

  const renderFooterAction = () => {
    const etapasLineares = ['boas_vindas', 'raca', 'classe', 'background', 'vantagens', 'desvantagens'];

    if (etapasLineares.includes(etapaAtual)) {
      const etapaValida = etapasConcluidas.includes(etapaAtual);

      return (
        <button
          onClick={() => avancarComMestre()}
          disabled={!etapaValida || enviando}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-fantasy font-bold transition-all ${
            !etapaValida || enviando
              ? isLight
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
              : 'bg-[linear-gradient(135deg,var(--wa-accent),var(--wa-accent-bright)_55%,var(--wa-teal))] text-white shadow-[0_18px_38px_rgba(139,92,246,0.28)] hover:-translate-y-0.5'
          }`}
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          Continuar
        </button>
      );
    }

    if (etapaAtual === 'atributos') {
      if (bonusAplicados) {
        return (
          <button
            onClick={() => avancarComMestre()}
            disabled={enviando}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-fantasy font-bold transition-all ${
              enviando
                ? isLight
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-[linear-gradient(135deg,var(--wa-accent),var(--wa-accent-bright)_55%,var(--wa-teal))] text-white shadow-[0_18px_38px_rgba(139,92,246,0.28)] hover:-translate-y-0.5'
            }`}
          >
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            Continuar
          </button>
        );
      }
      return (
        <button
          onClick={confirmarAtributos}
          disabled={enviando || pontosRestantes !== 0}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-fantasy font-bold transition-all ${
            pontosRestantes !== 0
              ? isLight
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
              : 'bg-[linear-gradient(135deg,var(--wa-teal),#14b8a6_55%,#0d9488)] text-white shadow-[0_18px_38px_rgba(45,212,191,0.24)] hover:-translate-y-0.5'
          }`}
        >
          <Check size={18} />
          {pontosRestantes !== 0 ? `Distribua todos os pontos (${pontosRestantes} restantes)` : 'Confirmar atributos'}
        </button>
      );
    }

    if (etapaAtual === 'resumo' || etapaAtual === 'refinamento') {
      return (
        <button
          onClick={salvarPersonagem}
          disabled={salvando || gerandoBackground || !podeCriar}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-fantasy font-bold transition-all ${
            salvando || gerandoBackground
              ? 'cursor-wait bg-slate-600 text-slate-300'
              : !podeCriar
                ? isLight
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'bg-[linear-gradient(135deg,var(--wa-accent),var(--wa-accent-bright)_45%,var(--wa-teal))] text-white shadow-[0_18px_42px_rgba(139,92,246,0.22)] hover:-translate-y-0.5'
          }`}
        >
          {salvando || gerandoBackground ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {gerandoBackground ? 'Gerando background...' : 'Selando personagem...'}
            </>
          ) : (
            <>
              <Save size={18} />
              {!podeCriar ? 'A ficha ainda precisa de ajustes' : 'Criar personagem'}
            </>
          )}
        </button>
      );
    }

    return null;
  };

  return (
    <div className={`wizard-atelier ${isLight ? 'light' : ''} relative flex h-full min-h-0 flex-col overflow-hidden`}>
      <div className="relative z-[1] flex h-full min-h-0 flex-col">
        {fichaAberta && (
          <div className="mx-4 mt-3 shrink-0 xl:hidden md:mx-5">
            <div className="wa-sidebar-panel rounded-[24px] p-4">
              <PersonagemPreviewCard
                nome={nome}
                raca={racaId}
                classe={classeId}
                atributos={atributosFinal}
                vantagensSelecionadas={allSelecoes}
                vantagensDisponiveis={vantagensDisponiveis}
                racasDisponiveis={racasDisponiveis}
                classesDisponiveis={classesDisponiveis}
                bonusJaAplicado={true}
                mostrarPendencias={true}
                bonusAplicados={bonusAplicados}
                skipVantagens={skipVantagens}
                skipDesvantagens={skipDesvantagens}
                variant="wizard"
                readinessState={readinessState}
              />
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4 pt-4 md:px-5 md:pb-5 xl:gap-5">
          <div className="wa-main-shell flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border">
            <div className="shrink-0">
              <WizardProgressBar
                etapas={etapas}
                etapaIndex={etapaIndex}
                isLight={isLight}
                onEtapaClick={navegarParaEtapa}
                etapasConcluidas={etapasConcluidas}
                etapasVisitadas={etapasVisitadas}
                tooltipMap={tooltipMap}
                onBack={() => navigate('/personagens')}
                onToggleFicha={() => setFichaAberta(prev => !prev)}
                fichaAberta={fichaAberta}
                embedded
              />
            </div>

            {(error || bonusInvalidado || draftRestaurado) && (
              <div className="shrink-0 space-y-3 border-t border-[var(--wa-border)] px-5 py-4 md:px-6">
                {error && (
                  <div className={`wa-panel rounded-2xl px-4 py-3 ${isLight ? 'text-red-700' : 'text-red-300'}`}>
                    <div className="flex items-center gap-3">
                      <AlertCircle size={16} className="shrink-0" />
                      <span className="flex-1 text-sm font-modern">{error}</span>
                      <button onClick={clearError} className="cursor-pointer opacity-70 transition-opacity hover:opacity-100">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {bonusInvalidado && (
                  <div className={`wa-panel rounded-2xl px-4 py-3 ${isLight ? 'text-purple-200' : 'text-purple-200'}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--wa-ember)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-ember)]">Leitura mecanica em revisao</p>
                        <p className="mt-1 text-sm font-modern">Os bonus foram invalidados por uma mudanca estrutural. Reconfirme os atributos antes de selar a ficha.</p>
                      </div>
                    </div>
                  </div>
                )}

                {draftRestaurado && (
                  <div className={`wa-panel rounded-2xl px-4 py-3 ${isLight ? 'text-purple-200' : 'text-purple-200'}`}>
                    <div className="flex items-center gap-3">
                      <Hammer size={16} className="shrink-0 text-[var(--wa-info)]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-info)]">Forja retomada</p>
                        <p className="mt-1 text-sm font-modern">O rascunho anterior foi reaberto e o estado atual da ficha foi restaurado.</p>
                      </div>
                      <button
                        onClick={descartarDraft}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-modern font-semibold transition-colors cursor-pointer ${
                          isLight ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/12 text-red-300 hover:bg-red-500/18'
                        }`}
                      >
                        <Trash2 size={12} />
                        Descartar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 border-t border-[var(--wa-border)]">
              <WizardChat
                mensagens={mensagens}
                inputTexto={inputTexto}
                setInputTexto={setInputTexto}
                enviando={enviando}
                onEnviar={enviarMensagem}
                onSelecionarSugestao={selecionarSugestao}
                onAvancarComMestre={avancarComMestre}
                onPularEtapa={pularEtapa}
                vantagensIds={vantagensIds}
                desvantagensIds={desvantagensIds}
                etapaAtual={etapaAtual}
                racasDisponiveis={racasDisponiveis}
                classesDisponiveis={classesDisponiveis}
                vantagensDisponiveis={vantagensDisponiveis}
                chatEndRef={chatEndRef}
                isLight={isLight}
                podeCriar={podeCriar}
                atributos={atributosBase}
                setAtributo={setAtributo}
                pontosDistribuidos={pontosDistribuidos}
                pontosRestantes={pontosRestantes}
                pontosTotais={pontosTotais}
                atributosSugeridos={atributosSugeridos}
                aplicarAtributosSugeridos={aplicarAtributosSugeridos}
                bonusAplicados={bonusAplicados}
                bonusDetalhes={bonusDetalhes}
                pontosCriacaoTotal={pontosCriacaoTotal}
                pontosCriacaoRestantes={pontosCriacaoRestantes}
                pontosGastos={pontosGastos}
                pontosVantagem={pontosVantagem}
                pontosDesvantagem={pontosDesvantagem}
                custoRaca={custoRaca}
                custoClasse={custoClasse}
                maxCustoDesvantagem={maxCustoDesvantagem}
                attrMin={attrMin}
                attrMax={attrMax}
                embedded
              />
            </div>

            <div className="wa-dock shrink-0 border-t border-[var(--wa-border)] px-5 py-2.5 md:px-6">
              {renderFooterAction()}
            </div>
          </div>

          <aside className="hidden xl:flex xl:w-[24rem] xl:shrink-0 xl:flex-col">
            <div className="wa-sidebar-panel flex h-full min-h-0 flex-col rounded-[28px] p-4">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <PersonagemPreviewCard
                  nome={nome}
                  raca={racaId}
                  classe={classeId}
                  atributos={atributosFinal}
                  vantagensSelecionadas={allSelecoes}
                  vantagensDisponiveis={vantagensDisponiveis}
                  racasDisponiveis={racasDisponiveis}
                  classesDisponiveis={classesDisponiveis}
                  bonusJaAplicado={true}
                  mostrarPendencias={true}
                  bonusAplicados={bonusAplicados}
                  skipVantagens={skipVantagens}
                  skipDesvantagens={skipDesvantagens}
                  variant="wizard"
                  readinessState={readinessState}
                />

                <div className="wa-panel-soft rounded-2xl p-3.5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                      Integridade da montagem
                    </span>
                    <span className="wa-emerald-chip rounded-full px-2 py-1 text-[10px] font-modern font-semibold">
                      {progressoItems.filter(item => item.done).length}/{progressoItems.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {progressoItems.map(({ label, done, skipped }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          done
                            ? skipped
                              ? isLight ? 'border-slate-300 text-slate-400' : 'border-slate-700 text-slate-500'
                              : 'border-emerald-400/50 text-emerald-400'
                            : isLight ? 'border-slate-300 text-slate-400' : 'border-slate-700 text-slate-500'
                        }`}>
                          {done ? <Check size={11} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        <span className={`text-xs font-modern ${
                          done
                            ? skipped
                              ? isLight ? 'text-slate-500' : 'text-slate-500'
                              : isLight ? 'text-slate-800' : 'text-slate-200'
                            : isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'
                        }`}>
                          {label}{skipped ? ' (pulado)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {(vantagensIds.length > 0 || desvantagensIds.length > 0) && (
                  <div className="wa-panel-soft rounded-2xl p-3.5">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-[var(--wa-accent)]" />
                      <span className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                        Selos fixados
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {vantagensIds.map(id => {
                        const item = vantagensDisponiveis.find(v => String(v.id) === String(id));
                        if (!item) return null;
                        return (
                          <button
                            key={`sv-${id}`}
                            onClick={() => removerSelecao('vantagem', id)}
                            className="wa-emerald-chip inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold transition-all hover:opacity-85 cursor-pointer"
                            title="Clique para remover"
                          >
                            {item.nome} x
                          </button>
                        );
                      })}

                      {desvantagensIds.map(id => {
                        const item = vantagensDisponiveis.find(d => String(d.id) === String(id));
                        if (!item) return null;
                        return (
                          <button
                            key={`sd-${id}`}
                            onClick={() => removerSelecao('desvantagem', id)}
                            className="wa-ember-chip inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold transition-all hover:opacity-85 cursor-pointer"
                            title="Clique para remover"
                          >
                            {item.nome} x
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WizardView;

