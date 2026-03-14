import React, { useState, useMemo } from 'react';
import { Send, Loader2, Sparkles, Search, X, Dices, BookOpen, Check, Info, RefreshCw, Shield, CheckCircle2 } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import AttributeDistributor from './AttributeDistributor.jsx';

const INPUT_PLACEHOLDERS = {
  boas_vindas: 'Descreva o nome que voce procura ou escolha uma sugestao...',
  raca: 'Peca outra linhagem ou descreva o tipo de heroi que imagina...',
  classe: 'Peca outra vocacao ou descreva como quer jogar...',
  background: 'Escreva a origem do personagem ou peca ajuda ao Mestre...',
  vantagens: 'Peca dons mais especificos ou refine o conceito do personagem...',
  desvantagens: 'Descreva falhas, custos ou conflitos interessantes...',
  atributos: 'Peça uma sugestao de distribuicao ou refine a build...',
  resumo: 'Peca ajustes finais ou confirme a direcao do personagem...',
  refinamento: 'Traga os ultimos ajustes antes de concluir...',
};

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
  vantagensDisponiveis,
  chatEndRef,
  isLight,
  podeCriar,
  atributos,
  setAtributo,
  pontosDistribuidos,
  pontosRestantes,
  pontosTotais,
  atributosSugeridos,
  aplicarAtributosSugeridos,
  bonusAplicados,
  bonusDetalhes,
  pontosCriacaoTotal,
  pontosCriacaoRestantes,
  pontosGastos,
  pontosVantagem,
  pontosDesvantagem,
  custoRaca,
  custoClasse,
  maxDesvantagens,
  attrMin,
  attrMax,
}) => {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtro, setFiltro] = useState('');

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

  const showAtributos = ['atributos', 'resumo', 'refinamento'].includes(etapaAtual);
  const mostrarBusca = ['raca', 'classe', 'vantagens', 'desvantagens'].includes(etapaAtual);

  const catalogoAtual = useMemo(() => {
    if (etapaAtual === 'raca') return racasDisponiveis || [];
    if (etapaAtual === 'classe') return classesDisponiveis || [];
    if (etapaAtual === 'vantagens') return (vantagensDisponiveis || []).filter(v => v.custo > 0);
    if (etapaAtual === 'desvantagens') return (vantagensDisponiveis || []).filter(v => v.custo < 0);
    return [];
  }, [etapaAtual, racasDisponiveis, classesDisponiveis, vantagensDisponiveis]);

  const tipoAtual = etapaAtual === 'raca'
    ? 'raca'
    : etapaAtual === 'classe'
      ? 'classe'
      : etapaAtual === 'vantagens'
        ? 'vantagem'
        : etapaAtual === 'desvantagens'
          ? 'desvantagem'
          : 'raca';

  const labelAtual = etapaAtual === 'raca'
    ? 'linhagens'
    : etapaAtual === 'classe'
      ? 'vocacoes'
      : etapaAtual === 'vantagens'
        ? 'vantagens'
        : etapaAtual === 'desvantagens'
          ? 'desvantagens'
          : '';

  const catalogoFiltrado = useMemo(() => {
    if (!filtro.trim()) return catalogoAtual;
    const termo = filtro.toLowerCase();
    return catalogoAtual.filter(item =>
      item.nome?.toLowerCase().includes(termo) ||
      item.descricao?.toLowerCase().includes(termo)
    );
  }, [catalogoAtual, filtro]);

  const handleSelecionarCatalogo = (item) => {
    const payload = {
      tipo: tipoAtual,
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
    };

    if (item.custo != null) payload.custo = item.custo;
    onSelecionarSugestao(payload);

    if (tipoAtual === 'vantagem' || tipoAtual === 'desvantagem') {
      return;
    }

    setBuscaAberta(false);
    setFiltro('');
  };

  const inputPlaceholder = INPUT_PLACEHOLDERS[etapaAtual] || 'Peca ajuda ao Mestre ou refine a escolha atual...';

  return (
    <div className="flex h-full flex-col">
      {etapaAtual !== 'boas_vindas' && (() => {
        const pctUsado = pontosCriacaoTotal > 0
          ? ((pontosCriacaoTotal - pontosCriacaoRestantes) / pontosCriacaoTotal) * 100
          : 0;
        const barColor = pontosCriacaoRestantes <= 0
          ? 'bg-red-500'
          : pontosCriacaoRestantes < pontosCriacaoTotal
            ? 'bg-amber-500'
            : 'bg-green-500';
        const nadaGasto = pontosGastos === 0 && pontosDesvantagem === 0;
        const etapaVantDesv = etapaAtual === 'vantagens' || etapaAtual === 'desvantagens';

        return (
          <div className={`shrink-0 border-b px-4 py-3 md:px-5 ${
            isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Pontos de criacao
                </span>
              </div>
              <span className={`text-lg font-mono font-bold tabular-nums ${
                pontosCriacaoRestantes <= 0 ? 'text-red-400' : pontosCriacaoRestantes < pontosCriacaoTotal ? 'text-amber-400' : 'text-green-400'
              }`}>
                {pontosCriacaoRestantes}<span className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>/{pontosCriacaoTotal}</span>
              </span>
            </div>

            <div className={`w-full h-2 rounded-full mb-2.5 ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-300`}
                style={{ width: `${Math.min(100, pctUsado)}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {nadaGasto ? (
                <span className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {etapaVantDesv ? 'Nenhum ponto gasto — voce pode pular esta etapa' : 'Nenhum ponto gasto ainda'}
                </span>
              ) : (
                <>
                  {custoRaca > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium ${isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/10 text-purple-400'}`}>
                      Linhagem -{custoRaca}
                    </span>
                  )}
                  {custoClasse > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
                      Vocacao -{custoClasse}
                    </span>
                  )}
                  {pontosVantagem > 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
                      Dons -{pontosVantagem}
                    </span>
                  )}
                  {pontosDesvantagem < 0 && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      +{Math.abs(pontosDesvantagem)} devolvidos
                    </span>
                  )}
                </>
              )}
              {etapaVantDesv && (
                <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-mono font-medium ${
                  desvantagensIds.length >= maxDesvantagens
                    ? isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'
                    : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                }`}>
                  Marcas {desvantagensIds.length}/{maxDesvantagens}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {showAtributos && (() => {
        const pctAttr = pontosTotais > 0 ? (pontosDistribuidos / pontosTotais) * 100 : 0;
        const attrBarColor = pontosRestantes === 0
          ? 'bg-green-500'
          : pontosRestantes < 0
            ? 'bg-red-500'
            : 'bg-purple-500';

        return (
          <div className={`shrink-0 border-b px-4 py-3 md:px-5 ${
            isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Dices size={16} className="text-purple-400" />
                <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Atributos base
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-mono font-bold tabular-nums ${
                  pontosRestantes === 0 ? 'text-green-400' : pontosRestantes < 0 ? 'text-red-400' : isLight ? 'text-slate-700' : 'text-white'
                }`}>
                  {pontosDistribuidos}<span className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>/{pontosTotais}</span>
                </span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-medium ${
                  pontosRestantes === 0
                    ? isLight ? 'bg-green-50 text-green-600' : 'bg-green-500/10 text-green-400'
                    : pontosRestantes < 0
                      ? isLight ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400'
                      : isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {pontosRestantes === 0 ? 'Completo' : `${pontosRestantes} restantes`}
                </span>
              </div>
            </div>

            <div className={`w-full h-2 rounded-full mb-2 ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
              <div
                className={`h-full rounded-full ${attrBarColor} transition-all duration-300`}
                style={{ width: `${Math.max(0, Math.min(100, pctAttr))}%` }}
              />
            </div>

            <p className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {pontosRestantes === 0
                ? 'Todos os pontos distribuidos. Confirme no botao abaixo.'
                : 'Ajuste a distribuicao antes de aplicar os bonus finais.'}
            </p>
          </div>
        );
      })()}

      <div className="flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4 space-y-4 min-h-0">
        {mensagens.map((msg, msgIndex) => {
          const isJogador = msg.role === 'jogador';
          const isSistema = msg.role === 'sistema';
          const isUltimaMensagemMestre = msg.role === 'mestre' && msgIndex === mensagens.length - 1;

          const bubbleClass = isJogador
            ? isLight
              ? 'bg-purple-500 text-white'
              : 'bg-purple-600 text-white'
            : isSistema
              ? isLight
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
              : isUltimaMensagemMestre
                ? isLight
                  ? 'bg-white border border-purple-200 text-slate-700 shadow-sm shadow-purple-100/70'
                  : 'bg-gradient-to-br from-slate-800/95 to-purple-950/30 border border-purple-500/20 text-slate-100 shadow-lg shadow-purple-950/20'
                : isLight
                  ? 'bg-white border border-slate-200 text-slate-700'
                  : 'bg-slate-800/60 border border-slate-700/30 text-slate-200';

          return (
            <div key={msg.id} className={`flex ${isJogador ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] lg:max-w-[86%] ${isJogador ? 'order-1' : ''}`}>
                <div className={`mb-1.5 flex items-center gap-2 ${isJogador ? 'justify-end' : ''}`}>
                  {msg.role === 'mestre' && <span className="text-xl">??</span>}
                  {msg.role === 'sistema' && <span className="text-xl">??</span>}
                  <span className={`text-xs font-modern font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                    {msg.role === 'mestre' ? 'Mestre Criador' : msg.role === 'sistema' ? 'Sistema' : 'Voce'}
                  </span>
                </div>

                <div className={`rounded-2xl px-4 py-3.5 ${bubbleClass}`}>
                  {isUltimaMensagemMestre && (
                    <div className={`mb-2 flex items-center gap-2 text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${
                      ['resumo', 'refinamento'].includes(etapaAtual)
                        ? isLight ? 'text-emerald-600' : 'text-emerald-300'
                        : isLight ? 'text-purple-600' : 'text-purple-300'
                    }`}>
                      {['resumo', 'refinamento'].includes(etapaAtual) ? (
                        <><CheckCircle2 size={13} />Revisao final</>
                      ) : (
                        <><Sparkles size={13} />Escolha guiada desta etapa</>
                      )}
                    </div>
                  )}
                  <div className="text-[15px] font-modern leading-relaxed">
                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                  </div>
                </div>

                {msg.sugestoes?.some(s => s.tipo === 'nome') && (
                  <div className="mt-3">
                    <div className={`mb-2 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Sparkles size={14} />
                      <span className="text-xs font-modern font-semibold uppercase tracking-wider">
                        Sugestoes de nome
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sugestoes.filter(s => s.tipo === 'nome').map((sug, i) => (
                        <button
                          key={`nome-${i}`}
                          type="button"
                          onClick={() => onEnviar(sug.nome)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-modern font-medium transition-all cursor-pointer ${
                            isLight
                              ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40'
                          }`}
                          title={sug.descricao || ''}
                        >
                          {sug.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {msg.sugestoes?.some(s => s.tipo === 'background') && (
                  <div className="mt-3">
                    <div className={`mb-2 flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <BookOpen size={14} />
                      <span className="text-xs font-modern font-semibold uppercase tracking-wider">
                        Sugestoes de origem
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.sugestoes.filter(s => s.tipo === 'background').map((sug, i) => (
                        <button
                          key={`bg-${i}`}
                          type="button"
                          onClick={() => onEnviar(sug.nome)}
                          className={`rounded-lg border px-4 py-2.5 text-left transition-all cursor-pointer ${
                            isLight
                              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                              : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/40'
                          }`}
                        >
                          <span className={`block text-sm font-modern font-semibold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                            {sug.nome}
                          </span>
                          {sug.descricao && (
                            <span className={`mt-0.5 block text-xs font-modern ${isLight ? 'text-amber-600/70' : 'text-amber-400/60'}`}>
                              {sug.descricao}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {msg.sugestoes?.some(s => !['nome', 'background'].includes(s.tipo)) && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5">
                    {msg.sugestoes.filter(s => !['nome', 'background'].includes(s.tipo)).map((sug, i) => (
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

                {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && !enviando &&
                  ['raca', 'classe', 'vantagens', 'desvantagens', 'background'].includes(etapaAtual) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnviar('Mostre-me outras opcoes diferentes')}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-modern font-medium transition-all cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30'
                      }`}
                    >
                      <RefreshCw size={12} />
                      Outras sugestoes
                    </button>

                    {mostrarBusca && (
                      <button
                        type="button"
                        onClick={() => { setBuscaAberta(prev => !prev); setFiltro(''); }}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-modern font-medium transition-all cursor-pointer ${
                          buscaAberta
                            ? isLight
                              ? 'bg-purple-100 text-purple-700 border-purple-300'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : isLight
                              ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200'
                              : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30'
                        }`}
                      >
                        <Search size={12} />
                        {buscaAberta ? 'Fechar catalogo' : `Abrir catalogo de ${labelAtual}`}
                      </button>
                    )}
                  </div>
                )}

                {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && showAtributos && !enviando && (
                  <div className="mt-3 space-y-3">
                    {bonusAplicados ? (
                      <div className={`rounded-xl border p-4 ${
                        isLight ? 'border-green-200 bg-green-50/50' : 'border-green-500/20 bg-green-500/5'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Shield size={16} className="text-green-400" />
                          <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                            Atributos confirmados
                          </span>
                          <CheckCircle2 size={14} className="text-green-400 ml-auto" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries({
                            forca: 'FOR', destreza: 'DES', constituicao: 'CON',
                            inteligencia: 'INT', agilidade: 'AGI', carisma: 'CAR',
                          }).map(([key, abbr]) => {
                            const val = atributos[key] || 10;
                            const bonus = bonusDetalhes?.[key] || 0;
                            const finalVal = val + bonus;
                            const mod = Math.floor((finalVal - 10) / 2);
                            return (
                              <div key={key} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                                isLight ? 'bg-white/80' : 'bg-slate-800/40'
                              }`}>
                                <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{abbr}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-sm font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{finalVal}</span>
                                  {bonus !== 0 && (
                                    <span className={`text-[10px] font-mono ${bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {bonus > 0 ? '+' : ''}{bonus}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ({mod >= 0 ? '+' : ''}{mod})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <AttributeDistributor
                          atributos={atributos}
                          setAtributo={setAtributo}
                          pontosDistribuidos={pontosDistribuidos}
                          pontosRestantes={pontosRestantes}
                          pontosTotais={pontosTotais}
                          atributosSugeridos={atributosSugeridos}
                          aplicarAtributosSugeridos={aplicarAtributosSugeridos}
                          isLight={isLight}
                          disabled={false}
                          attrMin={attrMin}
                          attrMax={attrMax}
                        />
                        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-modern leading-relaxed ${
                          isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}>
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Estes sao os pontos base. Bonus de raca, classe, vantagens e desvantagens serao aplicados automaticamente depois da confirmacao.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && mostrarBusca && buscaAberta && (
                  <div className={`mt-3 overflow-hidden rounded-xl border ${
                    isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-800/60'
                  }`}>
                    <div className={`border-b px-3 py-2.5 ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
                      <div className="flex items-center gap-2">
                        <Search size={14} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                        <input
                          type="text"
                          value={filtro}
                          onChange={(e) => setFiltro(e.target.value)}
                          placeholder={`Buscar ${labelAtual}...`}
                          className={`flex-1 bg-transparent text-xs font-modern outline-none ${
                            isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-200 placeholder-slate-500'
                          }`}
                        />
                        {filtro && (
                          <button type="button" onClick={() => setFiltro('')} className="cursor-pointer">
                            <X size={12} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      {catalogoFiltrado.length === 0 ? (
                        <p className={`px-3 py-4 text-center text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          Nenhum resultado para essa busca.
                        </p>
                      ) : (
                        catalogoFiltrado.map((item) => {
                          const isSelected = (tipoAtual === 'vantagem' && vantagensIds.includes(item.id)) ||
                            (tipoAtual === 'desvantagem' && desvantagensIds.includes(item.id));

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelecionarCatalogo(item)}
                              className={`w-full border-b px-3 py-2.5 text-left transition-colors last:border-b-0 cursor-pointer ${
                                isSelected
                                  ? isLight
                                    ? 'bg-purple-100 border-purple-200'
                                    : 'bg-purple-500/20 border-purple-500/30'
                                  : isLight
                                    ? 'border-slate-100 hover:bg-purple-50'
                                    : 'border-slate-700/30 hover:bg-purple-500/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                  {item.nome}
                                </span>
                                {item.custo != null && (
                                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                                    item.custo > 0
                                      ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/15 text-green-400'
                                      : isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/15 text-red-400'
                                  }`}>
                                    {item.custo > 0 ? '+' : ''}{item.custo} pts
                                  </span>
                                )}
                                {isSelected && <Check size={12} className="shrink-0 text-purple-400" />}
                              </div>
                              {item.descricao && (
                                <span className={`mt-0.5 block line-clamp-1 text-[11px] font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {item.descricao}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {enviando && (
          <div className="flex justify-start">
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-800/60 border border-slate-700/30'
            }`}>
              <span className="text-lg">??</span>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {['resumo', 'refinamento'].includes(etapaAtual) && podeCriar && !enviando && (
          <div className={`rounded-2xl border-2 p-4 text-center ${
            isLight
              ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50'
              : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-green-500/5'
          }`}>
            <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-400" />
            <p className={`text-base font-fantasy font-bold mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
              Personagem pronto para a aventura
            </p>
            <p className={`text-xs font-modern ${isLight ? 'text-emerald-600/70' : 'text-emerald-400/60'}`}>
              Todas as escolhas foram definidas. Use o botao abaixo para criar o personagem.
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className={`flex items-end gap-3 border-t p-4 shrink-0 ${
          isLight ? 'border-slate-200 bg-white/90' : 'border-slate-700/50 bg-slate-900/90'
        }`}
      >
        <textarea
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          disabled={enviando}
          rows={1}
          className={`flex-1 resize-none rounded-xl px-4 py-3 text-[15px] font-modern transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${
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
          className={`rounded-xl p-3 transition-all cursor-pointer ${
            inputTexto.trim() && !enviando
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20'
              : isLight
                ? 'bg-slate-200 text-slate-400'
                : 'bg-slate-700 text-slate-500'
          }`}
        >
          {enviando ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default WizardChat;
