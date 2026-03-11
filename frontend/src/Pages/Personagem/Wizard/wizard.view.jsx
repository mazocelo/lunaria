import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, X, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
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
    atributos,
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
    salvarPersonagem,
    clearError,

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
        {/* Botão toggle ficha — dourado */}
        <button
          onClick={() => setFichaAberta(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-bold transition-all cursor-pointer ${
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
        <WizardProgressBar etapas={etapas} etapaIndex={etapaIndex} isLight={isLight} />
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

      {/* Ficha collapse */}
      {fichaAberta && (
        <div className={`border-b overflow-y-auto max-h-[40vh] shrink-0 ${
          isLight ? 'border-slate-200 bg-white/95' : 'border-slate-700/50 bg-slate-900/95'
        } backdrop-blur-sm`}>
          <div className="p-4 max-w-lg mx-auto space-y-3">
            <PersonagemPreviewCard
              nome={nome}
              raca={racaId}
              classe={classeId}
              atributos={atributos}
              vantagensSelecionadas={allSelecoes}
              vantagensDisponiveis={vantagensDisponiveis}
              racasDisponiveis={racasDisponiveis}
              classesDisponiveis={classesDisponiveis}
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
                    const item = vantagensDisponiveis.find(v => v.id === id && v.tipo !== 'desvantagem');
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
                    const item = vantagensDisponiveis.find(d => d.id === id && d.tipo === 'desvantagem');
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

      {/* Chat (full width) */}
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
          chatEndRef={chatEndRef}
          isLight={isLight}
          atributos={atributos}
          setAtributo={setAtributo}
          pontosDistribuidos={pontosDistribuidos}
          pontosRestantes={pontosRestantes}
          pontosTotais={pontosTotais}
          atributosSugeridos={atributosSugeridos}
          aplicarAtributosSugeridos={aplicarAtributosSugeridos}
          salvarPersonagem={salvarPersonagem}
          salvando={salvando}
          gerandoBackground={gerandoBackground}
        />
      </div>
    </div>
  );
};

export default WizardView;
