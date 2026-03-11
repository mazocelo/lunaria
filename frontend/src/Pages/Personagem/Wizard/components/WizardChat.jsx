import React, { useState, useMemo } from 'react';
import { Send, Loader2, Sparkles, Search, X, Dices, Save } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import AttributeDistributor from './AttributeDistributor.jsx';

const WizardChat = ({
  mensagens,
  inputTexto,
  setInputTexto,
  enviando,
  onEnviar,
  onSelecionarSugestao,
  vantagensIds,
  desvantagensIds,
  etapaAtual,
  racasDisponiveis,
  classesDisponiveis,
  chatEndRef,
  isLight,
  // Atributos (inline no chat)
  atributos,
  setAtributo,
  pontosDistribuidos,
  pontosRestantes,
  pontosTotais,
  atributosSugeridos,
  aplicarAtributosSugeridos,
  // Salvar (inline no chat)
  salvarPersonagem,
  salvando,
  gerandoBackground,
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

  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtro, setFiltro] = useState('');

  const isSugestaoSelecionada = (sugestao) => {
    if (sugestao.tipo === 'vantagem') return vantagensIds.includes(sugestao.id);
    if (sugestao.tipo === 'desvantagem') return desvantagensIds.includes(sugestao.id);
    return false;
  };

  const showAtributos = ['atributos', 'resumo', 'refinamento'].includes(etapaAtual);
  const showSave = etapaAtual === 'refinamento';
  const mostrarBusca = etapaAtual === 'raca' || etapaAtual === 'classe';
  const catalogoAtual = etapaAtual === 'raca' ? racasDisponiveis : etapaAtual === 'classe' ? classesDisponiveis : [];
  const tipoAtual = etapaAtual === 'raca' ? 'raca' : 'classe';
  const labelAtual = etapaAtual === 'raca' ? 'raças' : 'classes';

  const catalogoFiltrado = useMemo(() => {
    if (!filtro.trim()) return catalogoAtual;
    const termo = filtro.toLowerCase();
    return catalogoAtual.filter(item =>
      item.nome?.toLowerCase().includes(termo) ||
      item.descricao?.toLowerCase().includes(termo)
    );
  }, [catalogoAtual, filtro]);

  const handleSelecionarCatalogo = (item) => {
    onSelecionarSugestao({
      tipo: tipoAtual,
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
    });
    setBuscaAberta(false);
    setFiltro('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header badge — pontos de atributo */}
      {showAtributos && (
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
        }`}>
          <div className="flex items-center gap-2">
            <Dices size={16} className="text-purple-400" />
            <span className={`text-xs font-modern font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Distribuição de Atributos
            </span>
          </div>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            pontosRestantes === 0
              ? 'bg-green-500/15 text-green-400'
              : pontosRestantes < 0
                ? 'bg-red-500/15 text-red-400'
                : 'bg-amber-500/15 text-amber-400'
          }`}>
            🎲 {pontosDistribuidos}/{pontosTotais}
          </span>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map((msg, msgIndex) => (
          <div key={msg.id} className={`flex ${msg.role === 'jogador' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'jogador' ? 'order-1' : ''}`}>
              {/* Avatar + Nome */}
              <div className={`flex items-center gap-2 mb-1 ${msg.role === 'jogador' ? 'justify-end' : ''}`}>
                {msg.role === 'mestre' && (
                  <span className="text-lg">🧙</span>
                )}
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-500'
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

              {/* Sugestões de nome (chips) */}
              {msg.sugestoes?.some(s => s.tipo === 'nome') && (
                <div className="mt-2">
                  <div className={`flex items-center gap-1.5 mb-1.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <Sparkles size={12} />
                    <span className="text-[10px] font-modern font-semibold uppercase tracking-wider">
                      Sugestões de nome
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sugestoes.filter(s => s.tipo === 'nome').map((sug, i) => (
                      <button
                        key={`nome-${i}`}
                        type="button"
                        onClick={() => onEnviar(sug.nome)}
                        className={`px-3 py-1 rounded-full text-xs font-modern font-medium transition-all cursor-pointer ${
                          isLight
                            ? 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                            : 'bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40'
                        }`}
                        title={sug.descricao || ''}
                      >
                        {sug.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões inline (raça, classe, vantagem, desvantagem) */}
              {msg.sugestoes?.some(s => s.tipo !== 'nome') && (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {msg.sugestoes.filter(s => s.tipo !== 'nome').map((sug, i) => (
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

              {/* Botão "Pesquisar outras" — na última mensagem do mestre em etapas raca/classe */}
              {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && mostrarBusca && !enviando && (
                <button
                  type="button"
                  onClick={() => { setBuscaAberta(prev => !prev); setFiltro(''); }}
                  className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-modern font-medium transition-all cursor-pointer ${
                    buscaAberta
                      ? isLight
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : isLight
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30'
                  }`}
                >
                  <Search size={12} />
                  {buscaAberta ? `Fechar busca` : `Pesquisar todas as ${labelAtual}`}
                </button>
              )}

              {/* Distribuidor de atributos inline — após última mensagem do mestre */}
              {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && showAtributos && !enviando && (
                <div className="mt-3 space-y-3">
                  <AttributeDistributor
                    atributos={atributos}
                    setAtributo={setAtributo}
                    pontosDistribuidos={pontosDistribuidos}
                    pontosRestantes={pontosRestantes}
                    pontosTotais={pontosTotais}
                    atributosSugeridos={atributosSugeridos}
                    aplicarAtributosSugeridos={aplicarAtributosSugeridos}
                    isLight={isLight}
                  />

                  {/* Botão Criar Personagem */}
                  {showSave && (
                    <button
                      onClick={salvarPersonagem}
                      disabled={salvando || gerandoBackground || pontosRestantes !== 0}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-fantasy font-bold text-sm transition-all cursor-pointer ${
                        salvando || gerandoBackground
                          ? 'bg-slate-600 text-slate-400 cursor-wait'
                          : pontosRestantes !== 0
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20'
                      }`}
                    >
                      {salvando || gerandoBackground ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {gerandoBackground ? 'Gerando background...' : 'Salvando...'}
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {pontosRestantes !== 0
                            ? `Distribua todos os pontos (${pontosRestantes} restantes)`
                            : 'Criar Personagem'
                          }
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Painel de busca expandido */}
              {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && mostrarBusca && buscaAberta && (
                <div className={`mt-2 rounded-lg border overflow-hidden ${
                  isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-800/60'
                }`}>
                  {/* Search input */}
                  <div className={`flex items-center gap-2 px-3 py-2 border-b ${
                    isLight ? 'border-slate-200' : 'border-slate-700/50'
                  }`}>
                    <Search size={14} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                    <input
                      type="text"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      placeholder={`Buscar ${labelAtual}...`}
                      className={`flex-1 text-xs font-modern bg-transparent outline-none ${
                        isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'
                      }`}
                    />
                    {filtro && (
                      <button onClick={() => setFiltro('')} className="cursor-pointer">
                        <X size={12} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                      </button>
                    )}
                  </div>

                  {/* Lista */}
                  <div className="max-h-48 overflow-y-auto">
                    {catalogoFiltrado.length === 0 ? (
                      <p className={`px-3 py-4 text-xs text-center font-modern ${
                        isLight ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Nenhuma {tipoAtual === 'raca' ? 'raça' : 'classe'} encontrada
                      </p>
                    ) : (
                      catalogoFiltrado.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelecionarCatalogo(item)}
                          className={`w-full text-left px-3 py-2 transition-colors cursor-pointer ${
                            isLight
                              ? 'hover:bg-purple-50 border-b border-slate-100 last:border-b-0'
                              : 'hover:bg-purple-500/10 border-b border-slate-700/30 last:border-b-0'
                          }`}
                        >
                          <span className={`text-sm font-fantasy font-bold block ${
                            isLight ? 'text-slate-800' : 'text-white'
                          }`}>
                            {item.nome}
                          </span>
                          {item.descricao && (
                            <span className={`text-[11px] font-modern line-clamp-1 ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {item.descricao}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
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
