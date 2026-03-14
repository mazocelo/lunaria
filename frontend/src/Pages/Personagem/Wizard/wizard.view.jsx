import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  ScrollText,
  ArrowRight,
  Check,
  Save,
  Loader2,
  Compass,
  Sparkles,
} from 'lucide-react';
import WizardProgressBar from './components/WizardProgressBar.jsx';
import WizardChat from './components/WizardChat.jsx';
import WizardStageHero from './components/WizardStageHero.jsx';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard.jsx';

const FOOTER_COPY = {
  boas_vindas: 'Defina o nome e avance para a identidade do personagem.',
  raca: 'Escolha a linhagem que melhor traduz a fantasia do heroi.',
  classe: 'Feche a vocacao para orientar estilo e papel em jogo.',
  background: 'Amarre a origem antes de seguir para refinamentos.',
  vantagens: 'Selecione apenas os dons que reforcam o conceito.',
  desvantagens: 'Aceite custos narrativos que voce queira interpretar.',
  atributos: 'Distribua todos os pontos e confirme os atributos base.',
  resumo: 'Revise coerencia entre escolhas e conclua a criacao.',
  refinamento: 'Ultima checagem antes de salvar a ficha.',
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
    maxDesvantagens,
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
  const podeCriar = !!(nome?.trim() && racaId && classeId && background?.trim() && bonusAplicados);
  const footerHint = FOOTER_COPY[etapaAtual] || 'Avance para a proxima etapa do wizard.';

  const progressoItems = [
    { label: 'Nome', done: !!nome, skipped: false },
    { label: 'Linhagem', done: !!racaId, skipped: false },
    { label: 'Vocacao', done: !!classeId, skipped: false },
    { label: 'Origem', done: !!background?.trim(), skipped: false },
    { label: 'Dons', done: vantagensIds.length > 0 || skipVantagens, skipped: skipVantagens },
    { label: 'Marcas', done: desvantagensIds.length > 0 || skipDesvantagens, skipped: skipDesvantagens },
    { label: 'Atributos', done: bonusAplicados, skipped: false },
  ];

  return (
    <div className={`flex h-full flex-col overflow-hidden ${
      isLight
        ? 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100'
        : 'bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900'
    }`}>
      <div className={`flex items-center gap-3 border-b px-4 py-3 shrink-0 ${
        isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
      } backdrop-blur-sm`}>
        <button
          onClick={() => navigate('/personagens')}
          className={`rounded-lg p-2.5 transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Forja do Destino
            </h1>
            {etapaAtualObj?.label && (
              <span className={`rounded-full px-2 py-1 text-[11px] font-modern font-semibold ${
                isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300'
              }`}>
                {etapaAtualObj.label}
              </span>
            )}
          </div>
          <p className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Criacao guiada de personagem
          </p>
        </div>

        <button
          onClick={() => setFichaAberta(prev => !prev)}
          className={`xl:hidden flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-modern font-bold transition-all cursor-pointer ${
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
          Resumo
          {fichaAberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

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

      <WizardStageHero
        etapas={etapas}
        etapaAtual={etapaAtual}
        etapaIndex={etapaIndex}
        nome={nome}
        racaId={racaId}
        classeId={classeId}
        background={background}
        vantagensIds={vantagensIds}
        desvantagensIds={desvantagensIds}
        skipVantagens={skipVantagens}
        skipDesvantagens={skipDesvantagens}
        racasDisponiveis={racasDisponiveis}
        classesDisponiveis={classesDisponiveis}
        isLight={isLight}
      />

      {error && (
        <div className={`flex items-center gap-2 px-4 py-2.5 shrink-0 ${
          isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle size={16} />
          <span className="flex-1 text-sm font-modern">{error}</span>
          <button onClick={clearError} className="cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {bonusInvalidado && (
        <div className={`flex items-center gap-2 px-4 py-2.5 shrink-0 ${
          isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-300'
        }`}>
          <AlertTriangle size={16} />
          <span className="flex-1 text-sm font-modern">
            Bonus invalidados. Revise e confirme novamente os atributos antes de salvar.
          </span>
        </div>
      )}

      {draftRestaurado && (
        <div className={`flex items-center gap-2 px-4 py-2.5 shrink-0 ${
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-300'
        }`}>
          <span className="flex-1 text-sm font-modern">Rascunho restaurado com sucesso.</span>
          <button
            onClick={descartarDraft}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-modern font-medium transition-colors cursor-pointer ${
              isLight ? 'hover:bg-red-100 text-red-600' : 'hover:bg-red-500/20 text-red-400'
            }`}
          >
            <Trash2 size={12} />
            Descartar e recomecar
          </button>
        </div>
      )}

      {fichaAberta && (
        <div className={`xl:hidden border-b overflow-y-auto max-h-[42vh] shrink-0 ${
          isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
        } backdrop-blur-sm`}>
          <div className="mx-auto max-w-2xl space-y-3 p-4">
            <div className={`rounded-xl border p-3 ${
              isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
            }`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass size={14} className={isLight ? 'text-slate-500' : 'text-slate-400'} />
                  <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Proximo passo
                  </span>
                </div>
                {proximaEtapa && (
                  <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {proximaEtapa.label}
                  </span>
                )}
              </div>
              <p className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {footerHint}
              </p>
            </div>

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
            />
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
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

          <div className={`shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
            isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
          } backdrop-blur-sm`}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-400" />
                  <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Acao principal
                  </span>
                </div>
                <p className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {footerHint}
                </p>
              </div>
              {etapaAtualObj?.label && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-modern font-semibold ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                }`}>
                  {etapaAtualObj.label}
                </span>
              )}
            </div>

            {(() => {
              const etapasLineares = ['boas_vindas', 'raca', 'classe', 'background', 'vantagens', 'desvantagens'];
              const podeSkip = etapaAtual === 'vantagens' || etapaAtual === 'desvantagens';

              if (etapasLineares.includes(etapaAtual)) {
                const etapaValida = etapasConcluidas.includes(etapaAtual);
                return (
                  <div className="flex gap-2">
                    {podeSkip && (
                      <button
                        onClick={() => pularEtapa(etapaAtual)}
                        disabled={enviando}
                        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-modern font-medium transition-all cursor-pointer ${
                          enviando
                            ? 'opacity-50 cursor-not-allowed'
                            : isLight
                              ? 'border border-slate-300 text-slate-500 hover:bg-slate-100'
                              : 'border border-slate-600 text-slate-400 hover:bg-slate-700/50'
                        }`}
                      >
                        Pular etapa
                      </button>
                    )}
                    <button
                      onClick={avancarComMestre}
                      disabled={!etapaValida || enviando}
                      className={`flex-1 flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-base font-fantasy font-bold transition-all cursor-pointer ${
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
                    className={`w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-base font-fantasy font-bold transition-all cursor-pointer ${
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
                      : 'Confirmar atributos'}
                  </button>
                );
              }

              if (etapaAtual === 'resumo' || etapaAtual === 'refinamento') {
                return (
                  <button
                    onClick={salvarPersonagem}
                    disabled={salvando || gerandoBackground || !podeCriar}
                    className={`w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-base font-fantasy font-bold transition-all cursor-pointer ${
                      salvando || gerandoBackground
                        ? 'bg-slate-600 text-slate-400 cursor-wait'
                        : !podeCriar
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
                        {!podeCriar ? 'Preencha todos os campos primeiro' : 'Criar personagem'}
                      </>
                    )}
                  </button>
                );
              }

              return null;
            })()}
          </div>
        </div>

        <aside className={`hidden xl:flex xl:w-[22rem] xl:shrink-0 xl:flex-col xl:overflow-y-auto border-l ${
          isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
        } backdrop-blur-sm`}>
          <div className="space-y-3 p-4">
            <div className={`rounded-xl border p-3 ${
              isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
            }`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass size={14} className={isLight ? 'text-slate-500' : 'text-slate-400'} />
                  <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Proximo passo
                  </span>
                </div>
                {proximaEtapa && (
                  <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {proximaEtapa.label}
                  </span>
                )}
              </div>
              <p className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {footerHint}
              </p>
            </div>

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
            />

            <div className={`rounded-xl border p-3 space-y-1.5 ${
              isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
            }`}>
              <h4 className={`mb-2 text-xs font-modern font-semibold uppercase tracking-[0.18em] ${
                isLight ? 'text-slate-600' : 'text-slate-500'
              }`}>
                Progresso da ficha
              </h4>
              {progressoItems.map(({ label, done, skipped }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? skipped
                        ? isLight ? 'bg-slate-200' : 'bg-slate-600/30'
                        : 'bg-green-500/20'
                      : isLight ? 'bg-slate-200' : 'bg-slate-700'
                  }`}>
                    {done ? (
                      <Check size={10} className={skipped ? 'text-slate-400' : 'text-green-400'} />
                    ) : (
                      <span className={`h-1.5 w-1.5 rounded-full ${isLight ? 'bg-slate-400' : 'bg-slate-500'}`} />
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

            {(vantagensIds.length > 0 || desvantagensIds.length > 0) && (
              <div className={`rounded-xl border p-3 ${
                isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
              }`}>
                <h4 className={`mb-2 text-xs font-modern font-semibold uppercase tracking-[0.18em] ${
                  isLight ? 'text-slate-600' : 'text-slate-500'
                }`}>
                  Selecao atual
                </h4>
                <div className="flex flex-wrap gap-1">
                  {vantagensIds.map(id => {
                    const item = vantagensDisponiveis.find(v => v.id === id);
                    if (!item) return null;
                    return (
                      <button
                        key={`sv-${id}`}
                        onClick={() => removerSelecao('vantagem', id)}
                        className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] text-green-400 transition-colors hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
                        title="Clique para remover"
                      >
                        {item.nome} x
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
                        className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400 transition-colors hover:bg-slate-500/15 hover:text-slate-400 cursor-pointer"
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
        </aside>
      </div>
    </div>
  );
};

export default WizardView;
