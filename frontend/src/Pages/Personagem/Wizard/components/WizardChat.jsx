import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer.jsx';
import SuggestionCard from './SuggestionCard.jsx';

const WizardChat = ({
  mensagens,
  inputTexto,
  setInputTexto,
  enviando,
  onEnviar,
  onSelecionarSugestao,
  vantagensIds,
  desvantagensIds,
  chatEndRef,
  isLight,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTexto.trim() && !enviando) {
      onEnviar(inputTexto);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSugestaoSelecionada = (sugestao) => {
    if (sugestao.tipo === 'vantagem') return vantagensIds.includes(sugestao.id);
    if (sugestao.tipo === 'desvantagem') return desvantagensIds.includes(sugestao.id);
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'jogador' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'jogador' ? 'order-1' : ''}`}>
              {/* Avatar + Nome */}
              <div className={`flex items-center gap-2 mb-1 ${msg.role === 'jogador' ? 'justify-end' : ''}`}>
                {msg.role === 'mestre' && (
                  <span className="text-lg">🧙</span>
                )}
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {msg.role === 'mestre' ? 'Mestre Criador' : 'Você'}
                </span>
              </div>

              {/* Balão */}
              <div className={`rounded-xl px-4 py-3 ${
                msg.role === 'jogador'
                  ? isLight
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-600 text-white'
                  : isLight
                    ? 'bg-white border border-slate-200 text-slate-700'
                    : 'bg-slate-800/60 border border-slate-700/30 text-slate-200'
              }`}>
                <div className="text-sm font-modern leading-relaxed">
                  <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                </div>
              </div>

              {/* Sugestões inline */}
              {msg.sugestoes?.length > 0 && (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {msg.sugestoes.map((sug, i) => (
                    <SuggestionCard
                      key={`${sug.id}-${i}`}
                      sugestao={sug}
                      onSelect={onSelecionarSugestao}
                      isLight={isLight}
                      selected={isSugestaoSelecionada(sug)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {enviando && (
          <div className="flex justify-start">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-800/60 border border-slate-700/30'
            }`}>
              <span className="text-lg">🧙</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-end gap-2 p-4 border-t ${
          isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
        }`}
      >
        <textarea
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua resposta..."
          disabled={enviando}
          rows={1}
          className={`flex-1 resize-none rounded-xl px-4 py-2.5 text-sm font-modern transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
            isLight
              ? 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200'
              : 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700'
          }`}
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
        />

        <button
          type="submit"
          disabled={!inputTexto.trim() || enviando}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            inputTexto.trim() && !enviando
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20'
              : isLight
                ? 'bg-slate-200 text-slate-400'
                : 'bg-slate-700 text-slate-500'
          }`}
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export default WizardChat;
