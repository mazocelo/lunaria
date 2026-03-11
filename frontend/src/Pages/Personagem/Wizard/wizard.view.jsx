import React from 'react';
import { ArrowLeft, AlertCircle, X } from 'lucide-react';
import WizardProgressBar from './components/WizardProgressBar.jsx';
import WizardChat from './components/WizardChat.jsx';
import WizardPreview from './components/WizardPreview.jsx';

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

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${
      isLight
        ? 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100'
        : 'bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${
        isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
      } backdrop-blur-sm`}>
        <button
          onClick={() => navigate('/personagens')}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Forja do Destino
          </h1>
          <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Criação guiada de personagem
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <WizardProgressBar etapas={etapas} etapaIndex={etapaIndex} isLight={isLight} />

      {/* Error banner */}
      {error && (
        <div className={`flex items-center gap-2 px-4 py-2 ${
          isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle size={14} />
          <span className="flex-1 text-xs font-modern">{error}</span>
          <button onClick={clearError} className="cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* Main content: split-screen */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Chat panel (left) */}
        <div className={`flex-1 md:w-3/5 flex flex-col min-h-0 border-r ${
          isLight ? 'border-slate-200' : 'border-slate-700/50'
        }`}>
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

        {/* Preview panel (right) */}
        <div className={`md:w-2/5 lg:w-[35%] overflow-y-auto ${
          isLight ? 'bg-slate-50/50' : 'bg-slate-900/50'
        }`}>
          <WizardPreview
            nome={nome}
            racaId={racaId}
            classeId={classeId}
            atributos={atributos}
            vantagensIds={vantagensIds}
            desvantagensIds={desvantagensIds}
            racasDisponiveis={racasDisponiveis}
            classesDisponiveis={classesDisponiveis}
            vantagensDisponiveis={vantagensDisponiveis}
            removerSelecao={removerSelecao}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardView;
