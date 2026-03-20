import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Trash2,
  X,
  Check,
  Sparkles,
  Hammer,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import './wizard-theme.css';
import WizardProgressBar from './components/WizardProgressBar.jsx';
import WizardChat from './components/WizardChat.jsx';
import WizardCreationResultModal from './components/WizardCreationResultModal.jsx';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard.jsx';
import {
  getProgressItems,
  getTooltipMap,
  getReadinessState,
  canCreate,
} from './stages/stageSelectors.js';

const WizardView = (props) => {
  const {
    etapas,
    etapaAtual,
    etapaIndex,
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    sugestoes,
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
    bonusFontes,
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
    error,
    comboPreviewData,
    comboPreviewLoading,
    comboPreviewErro,
    comboPreviewTentativa,
    comboPreviewBuildKey,
    recarregarComboPreview,
    regenerarComboPreview,
    creationFlowStatus,
    creationResultModalOpen,
    creationResultData,
    fecharResultadoCriacao,
    irParaPersonagens,
    verFichaCriada,
    imageUrl,
    imageLoading,
    imageError,
    gerarImagem,
    navigate,
  } = props;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [fichaAberta, setFichaAberta] = useState(false);

  const allSelecoes = useMemo(() => [...vantagensIds, ...desvantagensIds], [vantagensIds, desvantagensIds]);

  const racaAtual = useMemo(
    () => racasDisponiveis.find(item => String(item.id) === String(racaId)),
    [racasDisponiveis, racaId],
  );

  const classeAtual = useMemo(
    () => classesDisponiveis.find(item => String(item.id) === String(classeId)),
    [classesDisponiveis, classeId],
  );


  const buildState = useMemo(() => ({
    nome, racaId, classeId, background,
    vantagensIds, desvantagensIds,
    skipVantagens, skipDesvantagens,
    bonusAplicados, bonusInvalidado,
    racaAtual, classeAtual,
    orcamentoCriacaoValido: pontosCriacaoRestantes >= 0,
    pontosCriacaoRestantes,
  }), [
    nome, racaId, classeId, background,
    vantagensIds, desvantagensIds,
    skipVantagens, skipDesvantagens,
    bonusAplicados, bonusInvalidado,
    racaAtual, classeAtual,
    pontosCriacaoRestantes,
  ]);

  const podeCriar = useMemo(() => canCreate(buildState), [buildState]);
  const progressoItems = useMemo(() => getProgressItems(buildState), [buildState]);
  const tooltipMap = useMemo(() => getTooltipMap({ ...buildState, podeCriar }), [buildState, podeCriar]);
  const readinessState = useMemo(() => getReadinessState(buildState), [buildState]);
  const creationStatusLabel = useMemo(() => {
    switch (creationFlowStatus) {
      case 'creating_character':
        return 'Selando a ficha';
      case 'generating_background':
        return 'Tecendo o background final';
      case 'opening_result':
        return 'Registrando a resolutiva do Mestre';
      default:
        return '';
    }
  }, [creationFlowStatus]);

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
                pontosCriacaoRestantes={pontosCriacaoRestantes}
                pontosCriacaoTotal={pontosCriacaoTotal}
                pontosDistribuidos={pontosDistribuidos}
                pontosTotais={pontosTotais}
                pontosRestantes={pontosRestantes}
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
                atributosFinal={atributosFinal}
                setAtributo={setAtributo}
                pontosDistribuidos={pontosDistribuidos}
                pontosRestantes={pontosRestantes}
                pontosTotais={pontosTotais}
                atributosSugeridos={atributosSugeridos}
                aplicarAtributosSugeridos={aplicarAtributosSugeridos}
                bonusAplicados={bonusAplicados}
                bonusDetalhes={bonusDetalhes}
                bonusFontes={bonusFontes}
                pontosCriacaoTotal={pontosCriacaoTotal}
                pontosCriacaoRestantes={pontosCriacaoRestantes}
                pontosGastos={pontosGastos}
                pontosVantagem={pontosVantagem}
                 pontosDesvantagem={pontosDesvantagem}
                 custoRaca={custoRaca}
                 custoClasse={custoClasse}
                 maxCustoDesvantagem={maxCustoDesvantagem}
                 skipVantagens={skipVantagens}
                 skipDesvantagens={skipDesvantagens}
                 attrMin={attrMin}
                 attrMax={attrMax}
                onConfirmarAtributos={confirmarAtributos}
                onSalvarPersonagem={salvarPersonagem}
                salvando={salvando}
                comboPreviewData={comboPreviewData}
                comboPreviewLoading={comboPreviewLoading}
                comboPreviewErro={comboPreviewErro}
                comboPreviewTentativa={comboPreviewTentativa}
                comboPreviewBuildKey={comboPreviewBuildKey}
                onRegenerarComboPreview={regenerarComboPreview}
                onRecarregarComboPreview={recarregarComboPreview}
                creationFlowStatus={creationFlowStatus}
                sugestoes={sugestoes}
                imageUrl={imageUrl}
                imageLoading={imageLoading}
                imageError={imageError}
                onGerarImagem={() => gerarImagem({
                  nome,
                  racaNome: racaAtual?.nome,
                  classeNome: classeAtual?.nome,
                  background,
                  vantagensNomes: vantagensIds.map(id => vantagensDisponiveis.find(v => String(v.id) === String(id))?.nome).filter(Boolean),
                  desvantagensNomes: desvantagensIds.map(id => vantagensDisponiveis.find(v => String(v.id) === String(id))?.nome).filter(Boolean),
                })}
                embedded
              />
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

      {creationFlowStatus !== 'idle' && !creationResultModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-md">
          <div className="wa-combo-block max-w-xl rounded-[28px] p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--wa-accent)]/12 text-[var(--wa-accent)]">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <p className="mt-4 text-[11px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Fechamento da criacao
            </p>
            <h2 className={`mt-2 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {creationStatusLabel}
            </h2>
            <p className={`mt-3 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              O wizard continua na mesma tela enquanto a ficha, o background e a resolutiva final sao consolidados.
            </p>
          </div>
        </div>
      )}

      <WizardCreationResultModal
        open={creationResultModalOpen}
        data={creationResultData}
        onClose={fecharResultadoCriacao}
        onViewSheet={verFichaCriada}
        onGoToCharacters={irParaPersonagens}
        isLight={isLight}
      />
    </div>
  );
};

export default WizardView;



