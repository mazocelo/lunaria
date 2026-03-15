import React, { useMemo, useState } from 'react';
import { Send, Loader2, Sparkles, Search, X, Check, Info, RefreshCw, Shield, CheckCircle2, ScrollText, ArrowRight, Save } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import AttributeDistributor from './AttributeDistributor.jsx';
import MasterAvatarGlyph from './MasterAvatarGlyph.jsx';
import { getStageConfig } from '../stages/stageConfig.js';
import { canContinueStage, getContinueLabel } from '../stages/stageSelectors.js';

const WizardChat = ({
  mensagens,
  inputTexto,
  setInputTexto,
  enviando,
  sugestoes = [],
  onEnviar,
  onSelecionarSugestao,
  onAvancarComMestre,
  onPularEtapa,
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
  atributosFinal,
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
  maxCustoDesvantagem,
  skipVantagens = false,
  skipDesvantagens = false,
  attrMin,
  attrMax,
  onConfirmarAtributos,
  onSalvarPersonagem,
  salvando = false,
  embedded = false,
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
    if (sugestao.tipo === 'vantagem') return vantagensIds.some(id => String(id) === String(sugestao.id));
    if (sugestao.tipo === 'desvantagem') return desvantagensIds.some(id => String(id) === String(sugestao.id));
    return false;
  };

  const config = getStageConfig(etapaAtual);
  const showAtributos = config.showAttributePanel;
  const mostrarBusca = config.showCatalog;
  const tipoAtual = config.catalogType || 'raca';
  const labelAtual = config.catalogLabel || '';

  const catalogoAtual = useMemo(() => {
    if (tipoAtual === 'raca') return racasDisponiveis || [];
    if (tipoAtual === 'classe') return classesDisponiveis || [];
    if (tipoAtual === 'vantagem') return (vantagensDisponiveis || []).filter(v => v.custo > 0);
    if (tipoAtual === 'desvantagem') return (vantagensDisponiveis || []).filter(v => v.custo < 0);
    return [];
  }, [tipoAtual, racasDisponiveis, classesDisponiveis, vantagensDisponiveis]);

  const catalogoFiltrado = useMemo(() => {
    if (!filtro.trim()) return catalogoAtual;
    const termo = filtro.toLowerCase();
    return catalogoAtual.filter(item =>
      item.nome?.toLowerCase().includes(termo) ||
      item.descricao?.toLowerCase().includes(termo)
    );
  }, [catalogoAtual, filtro]);

  const ultimaMensagem = mensagens[mensagens.length - 1];
  const ultimaMensagemEhMestreDaEtapa = ultimaMensagem?.role === 'mestre' && ultimaMensagem?.etapa === etapaAtual;
  const saldoCriacaoInvalido = pontosCriacaoRestantes < 0;
  const refreshPrompt = config.refreshPrompt || 'Mostre-me outras opcoes diferentes para esta etapa sem avancar.';
  const buildStateChat = { vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens, bonusAplicados };
  const podeContinuarSelecoes = canContinueStage(etapaAtual, buildStateChat);
  const textoContinuarSelecoes = getContinueLabel(etapaAtual);

  const backgroundSugestoesAtuais = useMemo(() => (sugestoes || []).filter((item) => item.tipo === 'background'), [sugestoes]);
  /** Seleciona e auto-avanÃƒÂ§a para raca/classe; sÃƒÂ³ seleciona para vantagem/desvantagem */
  const handleSelectAndAdvance = (sugestao) => {
    onSelecionarSugestao(sugestao);
    if (sugestao.tipo === 'raca') {
      onAvancarComMestre?.({ raca_id: sugestao.id, raca_nome: sugestao.nome });
    } else if (sugestao.tipo === 'classe') {
      onAvancarComMestre?.({ classe_id: sugestao.id, classe_nome: sugestao.nome });
    }
  };

  const handleSelecionarCatalogo = (item) => {
    const payload = {
      tipo: tipoAtual,
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
    };
    if (item.custo != null) payload.custo = item.custo;
    handleSelectAndAdvance(payload);
    if (tipoAtual === 'vantagem' || tipoAtual === 'desvantagem') return;
    setBuscaAberta(false);
    setFiltro('');
  };

  const inputPlaceholder = config.placeholder || 'Peca ajuda ao Mestre ou refine a escolha atual...';

  return (
    <div className={embedded ? 'flex h-full flex-col' : 'wa-chat-shell mx-4 mb-4 mt-3 flex h-full flex-col rounded-[24px] md:mx-5 md:mb-5'}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
        {mensagens.map((msg, msgIndex) => {
          const isJogador = msg.role === 'jogador';
          const isSistema = msg.role === 'sistema';
          const isUltimaMensagemMestre = msg.role === 'mestre' && msgIndex === mensagens.length - 1 && msg.etapa === etapaAtual;

          const wrapperClass = isJogador
            ? 'wa-player-card rounded-[22px] px-4 py-3 text-white'
            : isSistema
              ? 'wa-system-card rounded-[20px] px-4 py-3'
              : isUltimaMensagemMestre
                ? 'wa-master-card rounded-[24px] px-4 py-4 md:px-5'
                : 'wa-panel rounded-[22px] px-4 py-3.5';

          return (
            <div key={msg.id} className={`flex ${isJogador ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] lg:max-w-[86%] ${isJogador ? 'order-1' : ''}`}>
                <div className={`mb-2 flex items-center gap-2 ${isJogador ? 'justify-end' : ''}`}>
                  {msg.role === 'mestre' && <MasterAvatarGlyph size={isUltimaMensagemMestre ? 'md' : 'sm'} isLight={isLight} glow={isUltimaMensagemMestre} />}
                  {msg.role === 'sistema' && <div className="wa-panel-soft inline-flex h-8 w-8 items-center justify-center rounded-full"><Info size={13} className="text-[var(--wa-accent)]" /></div>}
                  <span className={`text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                    {msg.role === 'mestre' ? 'Mestre Criador' : msg.role === 'sistema' ? 'Sistema' : 'Voce'}
                  </span>
                </div>

                <div className={wrapperClass}>
                  {isUltimaMensagemMestre && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${
                        ['resumo', 'refinamento'].includes(etapaAtual) ? 'wa-emerald-chip' : etapaAtual === 'atributos' ? 'wa-accent-chip' : 'wa-accent-chip'
                      }`}>
                        {config.showFinalAction ? 'Preparacao final' : config.showAttributePanel ? 'Leitura da build' : 'Direcao da etapa'}
                      </span>
                    </div>
                  )}

                  <div className={`text-[15px] font-modern leading-relaxed ${isSistema ? (isLight ? 'text-purple-800' : 'text-purple-200') : isJogador ? 'text-white' : isLight ? 'text-slate-700' : 'text-slate-100'}`}>
                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                  </div>
                </div>

                {isUltimaMensagemMestre && msg.sugestoes?.some(s => s.tipo === 'nome') && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.sugestoes.filter(s => s.tipo === 'nome').map((sug, i) => (
                      <button
                        key={`nome-${i}`}
                        type="button"
                        onClick={() => onEnviar(sug.nome)}
                        className="wa-panel-soft rounded-full px-3.5 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                        title={sug.descricao || ''}
                      >
                        {sug.nome}
                      </button>
                    ))}
                  </div>
                )}

                {isUltimaMensagemMestre && msg.sugestoes?.some(s => s.tipo === 'background') && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {msg.sugestoes.filter(s => s.tipo === 'background').map((sug, i) => (
                      <button
                        key={`bg-${i}`}
                        type="button"
                        onClick={() => onEnviar(sug.nome)}
                        className="wa-choice-card rounded-2xl border p-3 text-left cursor-pointer"
                      >
                        <span className={`block text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{sug.nome}</span>
                        {sug.descricao && <span className={`mt-1 block text-xs font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{sug.descricao}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {isUltimaMensagemMestre && msg.sugestoes?.some(s => !['nome', 'background'].includes(s.tipo)) && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5">
                    {msg.sugestoes.filter(s => !['nome', 'background'].includes(s.tipo)).map((sug, i) => (
                      <SuggestionCard
                        key={`${sug.id}-${i}`}
                        sugestao={sug}
                        onSelect={handleSelectAndAdvance}
                        isLight={isLight}
                        selected={isSugestaoSelecionada(sug)}
                        variant="atelier"
                      />
                    ))}
                  </div>
                )}

                {isUltimaMensagemMestre && !enviando && config.allowRefresh && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnviar(refreshPrompt, { manterEtapa: true })}
                      className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Novas leituras
                    </button>

                    {mostrarBusca && (
                      <button
                        type="button"
                        onClick={() => { setBuscaAberta(prev => !prev); setFiltro(''); }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all cursor-pointer ${buscaAberta ? 'wa-accent-chip' : 'wa-panel-soft hover:-translate-y-0.5'}`}
                      >
                        <Search size={12} />
                        {buscaAberta ? 'Fechar catalogo' : `Abrir catalogo de ${labelAtual}`}
                      </button>
                    )}

                    {config.allowSkip && (
                      <button
                        type="button"
                        onClick={() => onPularEtapa?.(etapaAtual)}
                        disabled={enviando}
                        className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                      >
                        <ArrowRight size={12} />
                        Pular etapa
                      </button>
                    )}
                  </div>
                )}

                {isUltimaMensagemMestre && showAtributos && !enviando && (
                  <div className="mt-3 space-y-3">
                    {bonusAplicados ? (
                      <div className="wa-panel-soft rounded-[22px] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Shield size={16} className="text-[var(--wa-teal)]" />
                          <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Atributos confirmados</span>
                          <CheckCircle2 size={14} className="ml-auto text-[var(--wa-teal)]" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries({ forca: 'FOR', destreza: 'DES', constituicao: 'CON', inteligencia: 'INT', agilidade: 'AGI', carisma: 'CAR' }).map(([key, abbr]) => {
                            const finalVal = atributosFinal?.[key] ?? (atributos[key] || 10);
                            const bonus = bonusDetalhes?.[key] || 0;
                            const mod = Math.floor((finalVal - 10) / 2);
                            return (
                              <div key={key} className={`rounded-xl border px-2.5 py-2 ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}>
                                <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{abbr}</div>
                                <div className={`mt-1 text-base font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{finalVal}</div>
                                <div className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mod >= 0 ? '+' : ''}{mod}{bonus !== 0 ? ` (${bonus > 0 ? '+' : ''}${bonus})` : ''}</div>
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
                        <div className="wa-panel-soft flex items-start gap-2 rounded-2xl px-3 py-3 text-xs font-modern leading-relaxed">
                          <Info size={14} className="mt-0.5 shrink-0 text-[var(--wa-accent)]" />
                          <span>
                            Estes sao os pontos base. Bonus de linhagem, vocacao, dons e marcas entram automaticamente depois da confirmacao.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isUltimaMensagemMestre && mostrarBusca && buscaAberta && (
                  <div className="wa-panel mt-3 overflow-hidden rounded-2xl">
                    <div className="border-b border-[var(--wa-border)] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Search size={14} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
                        <input
                          type="text"
                          value={filtro}
                          onChange={(e) => setFiltro(e.target.value)}
                          placeholder={`Buscar ${labelAtual}...`}
                          className={`flex-1 bg-transparent text-xs font-modern outline-none ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
                        />
                        {filtro && (
                          <button type="button" onClick={() => setFiltro('')} className="cursor-pointer">
                            <X size={12} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                      {catalogoFiltrado.length === 0 ? (
                        <p className={`px-3 py-4 text-center text-xs font-modern ${isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'}`}>
                          Nenhum resultado para essa busca.
                        </p>
                      ) : (
                        catalogoFiltrado.map((item) => {
                          const isSelected = (tipoAtual === 'vantagem' && vantagensIds.some(id => String(id) === String(item.id))) || (tipoAtual === 'desvantagem' && desvantagensIds.some(id => String(id) === String(item.id)));
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelecionarCatalogo(item)}
                              className={`block w-full border-b border-[var(--wa-border)] px-3 py-3 text-left transition-colors last:border-b-0 cursor-pointer ${isSelected ? (isLight ? 'bg-purple-100/70' : 'bg-purple-500/14') : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.nome}</span>
                                {item.custo != null && (
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-mono ${item.custo > 0 ? 'wa-ember-chip' : 'wa-emerald-chip'}`}>
                                    {item.custo > 0 ? `-${item.custo}` : `+${Math.abs(item.custo)}`} pts
                                  </span>
                                )}
                                {isSelected && <Check size={12} className="text-[var(--wa-accent)]" />}
                              </div>
                              {item.descricao && <span className={`mt-1 block text-[11px] font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{item.descricao}</span>}
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

        {!enviando && !ultimaMensagemEhMestreDaEtapa && (
          <div className="space-y-3">
            {config.allowRefresh && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEnviar(refreshPrompt, { manterEtapa: true })}
                  className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Novas leituras
                </button>

                {mostrarBusca && (
                  <button
                    type="button"
                    onClick={() => { setBuscaAberta(prev => !prev); setFiltro(''); }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all cursor-pointer ${buscaAberta ? 'wa-accent-chip' : 'wa-panel-soft hover:-translate-y-0.5'}`}
                  >
                    <Search size={12} />
                    {buscaAberta ? 'Fechar catalogo' : `Abrir catalogo de ${labelAtual}`}
                  </button>
                )}

                {config.allowSkip && (
                  <button
                    type="button"
                    onClick={() => onPularEtapa?.(etapaAtual)}
                    disabled={enviando}
                    className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <ArrowRight size={12} />
                    Pular etapa
                  </button>
                )}
              </div>
            )}

            {etapaAtual === 'background' && backgroundSugestoesAtuais.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {backgroundSugestoesAtuais.map((sug, i) => (
                  <button
                    key={`bg-stage-${i}`}
                    type="button"
                    onClick={() => onEnviar(sug.nome)}
                    className="wa-choice-card rounded-2xl border p-3 text-left cursor-pointer"
                  >
                    <span className={`block text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{sug.nome}</span>
                    {sug.descricao && <span className={`mt-1 block text-xs font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{sug.descricao}</span>}
                  </button>
                ))}
              </div>
            )}

            {showAtributos && (
              bonusAplicados ? (
                <div className="wa-panel-soft rounded-[22px] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-[var(--wa-teal)]" />
                    <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Atributos confirmados</span>
                    <CheckCircle2 size={14} className="ml-auto text-[var(--wa-teal)]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({ forca: 'FOR', destreza: 'DES', constituicao: 'CON', inteligencia: 'INT', agilidade: 'AGI', carisma: 'CAR' }).map(([key, abbr]) => {
                      const finalVal = atributosFinal?.[key] ?? (atributos[key] || 10);
                      const bonus = bonusDetalhes?.[key] || 0;
                      const mod = Math.floor((finalVal - 10) / 2);
                      return (
                        <div key={key} className={`rounded-xl border px-2.5 py-2 ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}>
                          <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{abbr}</div>
                          <div className={`mt-1 text-base font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{finalVal}</div>
                          <div className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mod >= 0 ? '+' : ''}{mod}{bonus !== 0 ? ` (${bonus > 0 ? '+' : ''}${bonus})` : ''}</div>
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
                  <div className="wa-panel-soft flex items-start gap-2 rounded-2xl px-3 py-3 text-xs font-modern leading-relaxed">
                    <Info size={14} className="mt-0.5 shrink-0 text-[var(--wa-accent)]" />
                    <span>
                      Estes sao os pontos base. Bonus de linhagem, vocacao, dons e marcas entram automaticamente depois da confirmacao.
                    </span>
                  </div>
                </>
              )
            )}

            {mostrarBusca && buscaAberta && (
              <div className="wa-panel overflow-hidden rounded-2xl">
                <div className="border-b border-[var(--wa-border)] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Search size={14} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
                    <input
                      type="text"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      placeholder={`Buscar ${labelAtual}...`}
                      className={`flex-1 bg-transparent text-xs font-modern outline-none ${isLight ? 'text-slate-700 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'}`}
                    />
                    {filtro && (
                      <button type="button" onClick={() => setFiltro('')} className="cursor-pointer">
                        <X size={12} className={isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {catalogoFiltrado.length === 0 ? (
                    <p className={`px-3 py-4 text-center text-xs font-modern ${isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'}`}>
                      Nenhum resultado para essa busca.
                    </p>
                  ) : (
                    catalogoFiltrado.map((item) => {
                      const isSelected = (tipoAtual === 'vantagem' && vantagensIds.some(id => String(id) === String(item.id))) || (tipoAtual === 'desvantagem' && desvantagensIds.some(id => String(id) === String(item.id)));
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelecionarCatalogo(item)}
                          className={`block w-full border-b border-[var(--wa-border)] px-3 py-3 text-left transition-colors last:border-b-0 cursor-pointer ${isSelected ? (isLight ? 'bg-purple-100/70' : 'bg-purple-500/14') : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.nome}</span>
                            {item.custo != null && (
                              <span className={`rounded-full px-2 py-1 text-[10px] font-mono ${item.custo > 0 ? 'wa-ember-chip' : 'wa-emerald-chip'}`}>
                                {item.custo > 0 ? `-${item.custo}` : `+${Math.abs(item.custo)}`} pts
                              </span>
                            )}
                            {isSelected && <Check size={12} className="text-[var(--wa-accent)]" />}
                          </div>
                          {item.descricao && <span className={`mt-1 block text-[11px] font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{item.descricao}</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {config.showBudgetPanel && !enviando && (
          <div className={`wa-panel-soft rounded-2xl border px-4 py-3 ${saldoCriacaoInvalido ? 'border-red-500/40' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                  Orcamento de criacao
                </p>
                <p className={`mt-1 text-sm font-modern ${saldoCriacaoInvalido ? 'text-red-400' : isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  Total {pontosCriacaoTotal} | gastos {pontosGastos} | saldo {pontosCriacaoRestantes}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-modern">
                <span className="wa-ember-chip rounded-full px-2 py-1">Raca {custoRaca}</span>
                <span className="wa-ember-chip rounded-full px-2 py-1">Classe {custoClasse}</span>
                <span className="wa-ember-chip rounded-full px-2 py-1">Vantagens {pontosVantagem}</span>
                <span className="wa-emerald-chip rounded-full px-2 py-1">Desvantagens +{Math.min(maxCustoDesvantagem, Math.abs(pontosDesvantagem))}</span>
              </div>
            </div>
          </div>
        )}
        {enviando && (
          <div className="flex justify-start">
            <div className="wa-master-card inline-flex items-center gap-3 rounded-[22px] px-4 py-3">
              <MasterAvatarGlyph size="md" isLight={isLight} glow />
              <div>
                <div className={`text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                  O mestre trabalha
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-accent-bright)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-teal)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                    O Mestre consulta os registros da forja...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {config.showFinalAction && podeCriar && !enviando && (
          <div className="wa-readiness-panel rounded-[24px] border p-4 text-center">
            <CheckCircle2 size={30} className="mx-auto mb-2 text-[var(--wa-teal)]" />
            <p className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              A ficha esta pronta para ser selada
            </p>
            <p className={`mt-2 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Todas as decisoes principais foram fixadas. Use o dock abaixo para concluir a criacao.
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="wa-dock shrink-0 border-t border-[var(--wa-border)] p-4 md:px-5">
        <div className="flex items-end gap-3">
          <textarea
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={enviando}
            rows={1}
            className={`min-h-[54px] flex-1 resize-none rounded-2xl border px-4 py-3 text-[15px] font-modern transition-all focus:outline-none ${
              isLight
                ? 'border-slate-200 bg-white/90 text-slate-800 placeholder-slate-400 focus:border-[var(--wa-accent)]'
                : 'border-slate-700 bg-slate-950/70 text-white placeholder-slate-500 focus:border-[var(--wa-accent)]'
            }`}
            style={{ maxHeight: '132px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 132)}px`;
            }}
          />

          {config.showFinalAction && saldoCriacaoInvalido && (
            <div className="mr-2 max-w-[16rem] text-right text-xs font-modern text-red-400">
              Ajuste o orcamento de criacao antes de selar a ficha.
            </div>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {etapaAtual === 'atributos' && !bonusAplicados && onConfirmarAtributos && (
              <button
                type="button"
                onClick={onConfirmarAtributos}
                disabled={enviando || pontosRestantes !== 0}
                className={`inline-flex h-[54px] items-center gap-2 rounded-2xl px-4 text-sm font-modern font-semibold transition-all cursor-pointer ${
                  pontosRestantes !== 0
                    ? isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-[var(--wa-teal)] to-[#0d9488] text-white shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <Check size={16} />
                {pontosRestantes !== 0 ? `${pontosRestantes} pts` : 'Confirmar'}
              </button>
            )}

            {config.requireExplicitContinue && !(config.showAttributePanel && !bonusAplicados) && (
              <button
                type="button"
                onClick={() => onAvancarComMestre?.()}
                disabled={enviando || !podeContinuarSelecoes}
                className={`inline-flex h-[54px] items-center gap-2 rounded-2xl px-4 text-sm font-modern font-semibold transition-all cursor-pointer ${
                  enviando
                    ? 'cursor-wait bg-slate-600 text-slate-300'
                    : !podeContinuarSelecoes
                      ? isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <ArrowRight size={16} />
                {podeContinuarSelecoes ? textoContinuarSelecoes : config.allowSkip ? 'Selecione ou pule' : 'Confirme antes'}
              </button>
            )}

            {config.showFinalAction && onSalvarPersonagem && (
              <button
                type="button"
                onClick={onSalvarPersonagem}
                disabled={salvando || !podeCriar}
                className={`inline-flex h-[54px] items-center gap-2 rounded-2xl px-4 text-sm font-modern font-semibold transition-all cursor-pointer ${
                  salvando
                    ? 'cursor-wait bg-slate-600 text-slate-300'
                    : !podeCriar
                      ? isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {salvando
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Save size={16} />
                }
                {salvando ? 'Selando...' : saldoCriacaoInvalido ? 'Orcamento excedido' : !podeCriar ? 'Incompleto' : 'Criar'}
              </button>
            )}

            <button
              type="submit"
              disabled={!inputTexto.trim() || enviando}
              className={`inline-flex h-[54px] w-[54px] items-center justify-center rounded-2xl transition-all cursor-pointer ${
                inputTexto.trim() && !enviando
                  ? 'bg-gradient-to-br from-[var(--wa-accent)] via-[var(--wa-accent-bright)] to-[var(--wa-accent)] text-white shadow-lg'
                  : isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {enviando ? <Loader2 size={20} className="animate-spin" /> : etapaAtual === 'background' ? <ScrollText size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WizardChat;








