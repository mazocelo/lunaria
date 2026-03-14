import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, AlertTriangle, Trash2, X, ChevronDown, ChevronUp, ScrollText, ArrowRight, Check, Save, Loader2 } from 'lucide-react';
import WizardProgressBar from './components/WizardProgressBar.jsx';
import WizardChat from './components/WizardChat.jsx';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard.jsx';

const WizardView = (props) => {
  const {
    // Wizard
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

    // Personagem
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

    // Catálogos
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,

    // Actions
    enviarMensagem,
    selecionarSugestao,
    removerSelecao,
    aplicarAtributosSugeridos,
    setAtributo,
    confirmarAtributos,
    salvarPersonagem,
    avancarComMestre,
    navegarParaEtapa,
    clearError,

    // Bonus
    bonusAplicados,
    bonusDetalhes,
    bonusInvalidado,

    // Skip
    skipVantagens,
    setSkipVantagens,
    skipDesvantagens,
    setSkipDesvantagens,

    // Background
    background,

    // Draft
    draftRestaurado,
    descartarDraft,

    // Navigation
    etapasConcluidas,
    etapasVisitadas,

    // Limites de seleção
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    pontosVantagem,
    pontosDesvantagem,
    maxDesvantagens,

    // Limites de atributos
    attrMin,
    attrMax,

    // State
    salvando,
    gerandoBackground,
    error,
    isLight,
    navigate,
  } = props;

  const [fichaAberta, setFichaAberta] = useState(false);
  const allSelecoes = [...vantagensIds, ...desvantagensIds];

  return (
    <div className={`h-full flex flex-col overflow-hidden ${
      isLight
        ? 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100'
        : 'bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 ${
        isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
      } backdrop-blur-sm`}>
        <button
          onClick={() => navigate('/personagens')}
          className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Forja do Destino
          </h1>
          <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Criação guiada de personagem
          </p>
        </div>
        {/* Botão toggle ficha — dourado (hidden on xl+ where sidebar is always visible) */}
        <button
          onClick={() => setFichaAberta(prev => !prev)}
          className={`xl:hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-bold transition-all cursor-pointer ${
            fichaAberta
              ? isLight
                ? 'bg-amber-100 text-amber-700 border-2 border-amber-400 shadow-md shadow-amber-200/50'
                : 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 shadow-md shadow-amber-500/10'
              : isLight
                ? 'bg-amber-50 text-amber-600 border-2 border-amber-300 hover:bg-amber-100 hover:shadow-md hover:shadow-amber-200/50'
                : 'bg-amber-500/10 text-amber-400 border-2 border-amber-500/30 hover:bg-amber-500/20 hover:shadow-md hover:shadow-amber-500/10'
          }`}
        >
          <ScrollText size={16} />
          Ficha
          {fichaAberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0">
        <WizardProgressBar
          etapas={etapas}
          etapaIndex={etapaIndex}
          isLight={isLight}
          onEtapaClick={navegarParaEtapa}
          etapasConcluidas={etapasConcluidas}
          etapasVisitadas={etapasVisitadas}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className={`flex items-center gap-2 px-4 py-2.5 shrink-0 ${
          isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle size={16} />
          <span className="flex-1 text-sm font-modern">{error}</span>
          <button onClick={clearError} className="cursor-pointer"><X size={16} /></button>
        </div>
      )}

      {/* T3: Banner de bônus invalidados */}
      {bonusInvalidado && (
        <div className={`flex items-center gap-2 px-4 py-2.5 shrink-0 ${
          isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-300'
        }`}>
          <AlertTriangle size={16} />
          <span className="flex-1 text-sm font-modern">
            Bônus invalidados — confirme novamente seus atributos antes de salvar.
          </span>
        </div>
      )}

      {/* T4: Opção de descartar draft */}
      {draftRestaurado && (
        <div className={`flex items-center gap-2 px-4 py-2 shrink-0 ${
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-300'
        }`}>
          <span className="flex-1 text-sm font-modern">Rascunho restaurado.</span>
          <button
            onClick={descartarDraft}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-modern font-medium transition-colors cursor-pointer ${
              isLight
                ? 'hover:bg-red-100 text-red-600'
                : 'hover:bg-red-500/20 text-red-400'
            }`}
          >
            <Trash2 size={12} />
            Descartar e recomeçar
          </button>
        </div>
      )}

      {/* Ficha collapse (hidden on xl+ where sidebar is always visible) */}
      {fichaAberta && (
        <div className={`xl:hidden border-b overflow-y-auto max-h-[40vh] shrink-0 ${
          isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
        } backdrop-blur-sm`}>
          <div className="p-4 max-w-lg mx-auto space-y-3">
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
              skipVantagens={skipVantagens}
              skipDesvantagens={skipDesvantagens}
            />

            {/* Seleções removíveis */}
            {(vantagensIds.length > 0 || desvantagensIds.length > 0) && (
              <div className={`rounded-lg border p-3 ${
                isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
              }`}>
                <h4 className={`text-xs font-modern font-semibold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-500'
                }`}>
                  Seleções
                </h4>
                <div className="flex flex-wrap gap-1">
                  {vantagensIds.map(id => {
                    const item = vantagensDisponiveis.find(v => v.id === id);
                    if (!item) return null;
                    return (
                      <button
                        key={`v-${id}`}
                        onClick={() => removerSelecao('vantagem', id)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
                        title="Clique para remover"
                      >
                        {item.nome} ×
                      </button>
                    );
                  })}
                  {desvantagensIds.map(id => {
                    const item = vantagensDisponiveis.find(d => d.id === id);
                    if (!item) return null;
                    return (
                      <button
                        key={`d-${id}`}
                        onClick={() => removerSelecao('desvantagem', id)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 hover:bg-slate-500/15 hover:text-slate-400 transition-colors cursor-pointer"
                        title="Clique para remover"
                      >
                        {item.nome} ×
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area: Chat + optional sidebar */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Left: Chat + Footer */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
        <WizardChat
          mensagens={mensagens}
          inputTexto={inputTexto}
          setInputTexto={setInputTexto}
          enviando={enviando}
          onEnviar={enviarMensagem}
          onSelecionarSugestao={selecionarSugestao}
          vantagensIds={vantagensIds}
          desvantagensIds={desvantagensIds}
          etapaAtual={etapaAtual}
          racasDisponiveis={racasDisponiveis}
          classesDisponiveis={classesDisponiveis}
          vantagensDisponiveis={vantagensDisponiveis}
          chatEndRef={chatEndRef}
          isLight={isLight}
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
          pontosVantagem={pontosVantagem}
          pontosDesvantagem={pontosDesvantagem}
          maxDesvantagens={maxDesvantagens}
          attrMin={attrMin}
          attrMax={attrMax}
        />
      </div>

      {/* Footer sticky com CTA contextual (T5) */}
      <div className={`shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
        isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
      } backdrop-blur-sm`}>
        {(() => {
          const etapasLineares = ['boas_vindas', 'raca', 'classe', 'background', 'vantagens', 'desvantagens'];
          const podeSkip = etapaAtual === 'vantagens' || etapaAtual === 'desvantagens';
          if (etapasLineares.includes(etapaAtual)) {
            const etapaValida = etapasConcluidas.includes(etapaAtual);
            const handleSkip = () => {
              if (etapaAtual === 'vantagens') {
                vantagensIds.forEach(id => removerSelecao('vantagem', id));
                setSkipVantagens(true);
              } else {
                desvantagensIds.forEach(id => removerSelecao('desvantagem', id));
                setSkipDesvantagens(true);
              }
              avancarComMestre();
            };
            return (
              <div className="flex gap-2">
                {podeSkip && (
                  <button
                    onClick={handleSkip}
                    disabled={enviando}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-modern font-medium text-sm transition-all cursor-pointer ${
                      enviando
                        ? 'opacity-50 cursor-not-allowed'
                        : isLight
                          ? 'border border-slate-300 text-slate-500 hover:bg-slate-100'
                          : 'border border-slate-600 text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    Pular
                  </button>
                )}
                <button
                  onClick={avancarComMestre}
                  disabled={!etapaValida || enviando}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-fantasy font-bold text-base transition-all cursor-pointer ${
                    !etapaValida || enviando
                      ? isLight
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20'
                  }`}
                >
                  {enviando ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  Continuar
                </button>
              </div>
            );
          }
          if (etapaAtual === 'atributos') {
            return (
              <button
                onClick={confirmarAtributos}
                disabled={enviando || pontosRestantes !== 0}
                className={`w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-fantasy font-bold text-base transition-all cursor-pointer ${
                  pontosRestantes !== 0
                    ? isLight
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <Check size={18} />
                {pontosRestantes !== 0
                  ? `Distribua todos os pontos (${pontosRestantes} restantes)`
                  : 'Confirmar Atributos'
                }
              </button>
            );
          }
          if (etapaAtual === 'resumo' || etapaAtual === 'refinamento') {
            const podecriar = !!(nome?.trim() && racaId && classeId && background?.trim() && bonusAplicados);
            return (
              <button
                onClick={salvarPersonagem}
                disabled={salvando || gerandoBackground || !podecriar}
                className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-fantasy font-bold text-base transition-all cursor-pointer ${
                  salvando || gerandoBackground
                    ? 'bg-slate-600 text-slate-400 cursor-wait'
                    : !podecriar
                      ? isLight
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20'
                }`}
              >
                {salvando || gerandoBackground ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {gerandoBackground ? 'Gerando background...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {!podecriar ? 'Preencha todos os campos primeiro' : 'Criar Personagem'}
                  </>
                )}
              </button>
            );
          }
          return null;
        })()}
      </div>
      </div>{/* end left column */}

        {/* T7: Sidebar — ficha lateral fixa (xl+ only) */}
        <aside className={`hidden xl:flex xl:flex-col xl:w-80 xl:shrink-0 border-l overflow-y-auto ${
          isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
        } backdrop-blur-sm`}>
          <div className="p-4 space-y-3">
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
              skipVantagens={skipVantagens}
              skipDesvantagens={skipDesvantagens}
            />

            {/* Pending fields indicators */}
            <div className={`rounded-lg border p-3 space-y-1.5 ${
              isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
            }`}>
              <h4 className={`text-xs font-modern font-semibold uppercase tracking-wider mb-2 ${
                isLight ? 'text-slate-600' : 'text-slate-500'
              }`}>
                Progresso
              </h4>
              {[
                { label: 'Nome', done: !!nome, skipped: false },
                { label: 'Raça', done: !!racaId, skipped: false },
                { label: 'Classe', done: !!classeId, skipped: false },
                { label: 'Vantagens', done: vantagensIds.length > 0 || skipVantagens, skipped: skipVantagens },
                { label: 'Desvantagens', done: desvantagensIds.length > 0 || skipDesvantagens, skipped: skipDesvantagens },
                { label: 'Atributos', done: bonusAplicados, skipped: false },
              ].map(({ label, done, skipped }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? skipped ? (isLight ? 'bg-slate-200' : 'bg-slate-600/30') : 'bg-green-500/20'
                      : isLight ? 'bg-slate-200' : 'bg-slate-700'
                  }`}>
                    {done ? (
                      <Check size={10} className={skipped ? 'text-slate-400' : 'text-green-400'} />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-400' : 'bg-slate-500'}`} />
                    )}
                  </span>
                  <span className={`text-xs font-modern ${
                    done
                      ? skipped
                        ? isLight ? 'text-slate-400' : 'text-slate-500'
                        : isLight ? 'text-slate-700' : 'text-slate-300'
                      : isLight ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {label}{skipped ? ' (pulado)' : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Seleções removíveis */}
            {(vantagensIds.length > 0 || desvantagensIds.length > 0) && (
              <div className={`rounded-lg border p-3 ${
                isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
              }`}>
                <h4 className={`text-xs font-modern font-semibold uppercase tracking-wider mb-2 ${
                  isLight ? 'text-slate-600' : 'text-slate-500'
                }`}>
                  Seleções
                </h4>
                <div className="flex flex-wrap gap-1">
                  {vantagensIds.map(id => {
                    const item = vantagensDisponiveis.find(v => v.id === id);
                    if (!item) return null;
                    return (
                      <button
                        key={`sv-${id}`}
                        onClick={() => removerSelecao('vantagem', id)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400 transition-colors cursor-pointer"
                        title="Clique para remover"
                      >
                        {item.nome} ×
                      </button>
                    );
                  })}
                  {desvantagensIds.map(id => {
                    const item = vantagensDisponiveis.find(d => d.id === id);
                    if (!item) return null;
                    return (
                      <button
                        key={`sd-${id}`}
                        onClick={() => removerSelecao('desvantagem', id)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 hover:bg-slate-500/15 hover:text-slate-400 transition-colors cursor-pointer"
                        title="Clique para remover"
                      >
                        {item.nome} ×
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>{/* end main content row */}
    </div>
  );
};

export default WizardView;
