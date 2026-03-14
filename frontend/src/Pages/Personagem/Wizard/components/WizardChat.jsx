import React, { useMemo, useState } from 'react';
import { Send, Loader2, Sparkles, Search, X, Dices, BookOpen, Check, Info, RefreshCw, Shield, CheckCircle2, ScrollText } from 'lucide-react';
import MarkdownRenderer from '../../../../components/MarkdownRenderer.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import AttributeDistributor from './AttributeDistributor.jsx';
import MasterAvatarGlyph from './MasterAvatarGlyph.jsx';

const INPUT_PLACEHOLDERS = {
  boas_vindas: 'Descreva o nome que voce procura ou aceite uma sugestao...',
  raca: 'Peca outra linhagem ou descreva o heroi que imagina...',
  classe: 'Peca outra vocacao ou descreva como quer jogar...',
  background: 'Escreva a origem do personagem ou peca ajuda ao Mestre...',
  vantagens: 'Peca dons mais especificos ou refine o conceito...',
  desvantagens: 'Descreva falhas, custos ou conflitos interessantes...',
  atributos: 'Peca uma sugestao de distribuicao ou refine a build...',
  resumo: 'Peca ajustes finais ou confirme a direcao do personagem...',
  refinamento: 'Traga os ultimos ajustes antes de concluir...',
};

const getStageLabel = (etapaAtual) => {
  if (['resumo', 'refinamento'].includes(etapaAtual)) return 'Preparacao final';
  if (etapaAtual === 'atributos') return 'Leitura da build';
  return 'Direcao da etapa';
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
        ? 'dons'
        : etapaAtual === 'desvantagens'
          ? 'marcas'
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
    if (tipoAtual === 'vantagem' || tipoAtual === 'desvantagem') return;
    setBuscaAberta(false);
    setFiltro('');
  };

  const inputPlaceholder = INPUT_PLACEHOLDERS[etapaAtual] || 'Peca ajuda ao Mestre ou refine a escolha atual...';

  return (
    <div className="wa-chat-shell mx-4 mb-4 mt-3 flex h-full flex-col rounded-[24px] md:mx-5 md:mb-5">
      {etapaAtual !== 'boas_vindas' && (
        <div className="wa-panel-soft border-b border-[var(--wa-border)] px-4 py-3 md:px-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--wa-brass)]" />
              <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Ledger de criacao
              </span>
            </div>
            <span className={`text-sm font-mono font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
              {pontosCriacaoRestantes}/{pontosCriacaoTotal}
            </span>
          </div>

          <div className={`h-2 overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--wa-brass)] via-[var(--wa-violet)] to-[var(--wa-emerald)] transition-all duration-300"
              style={{ width: `${Math.min(100, pontosCriacaoTotal > 0 ? ((pontosCriacaoTotal - pontosCriacaoRestantes) / pontosCriacaoTotal) * 100 : 0)}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {custoRaca > 0 && <span className="wa-violet-chip rounded-full px-2 py-1 text-[10px] font-mono">Linhagem -{custoRaca}</span>}
            {custoClasse > 0 && <span className="wa-brass-chip rounded-full px-2 py-1 text-[10px] font-mono">Vocacao -{custoClasse}</span>}
            {pontosVantagem > 0 && <span className="wa-ember-chip rounded-full px-2 py-1 text-[10px] font-mono">Dons -{pontosVantagem}</span>}
            {pontosDesvantagem < 0 && <span className="wa-emerald-chip rounded-full px-2 py-1 text-[10px] font-mono">+{Math.abs(pontosDesvantagem)} devolvidos</span>}
            {(etapaAtual === 'vantagens' || etapaAtual === 'desvantagens') && (
              <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-mono ${desvantagensIds.length >= maxDesvantagens ? 'wa-ember-chip' : 'wa-panel-soft'}`}>
                Marcas {desvantagensIds.length}/{maxDesvantagens}
              </span>
            )}
            {pontosGastos === 0 && pontosDesvantagem === 0 && (
              <span className={`text-[11px] font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                Nenhum custo fixado ainda.
              </span>
            )}
          </div>
        </div>
      )}

      {showAtributos && (
        <div className="wa-panel-soft border-b border-[var(--wa-border)] px-4 py-3 md:px-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Dices size={16} className="text-[var(--wa-violet)]" />
              <span className={`text-xs font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-600' : 'text-[var(--wa-muted)]'}`}>
                Calibracao de atributos
              </span>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-mono font-semibold ${pontosRestantes === 0 ? 'wa-emerald-chip' : 'wa-violet-chip'}`}>
              {pontosDistribuidos}/{pontosTotais}
            </span>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-800/80'}`}>
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--wa-violet)] to-[var(--wa-emerald)] transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, pontosTotais > 0 ? (pontosDistribuidos / pontosTotais) * 100 : 0))}%` }} />
          </div>
          <p className={`mt-2 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
            {pontosRestantes === 0 ? 'Todos os pontos base foram distribuidos.' : `${pontosRestantes} pontos ainda aguardam definicao.`}
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
        {mensagens.map((msg, msgIndex) => {
          const isJogador = msg.role === 'jogador';
          const isSistema = msg.role === 'sistema';
          const isUltimaMensagemMestre = msg.role === 'mestre' && msgIndex === mensagens.length - 1;

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
                  {msg.role === 'sistema' && <div className="wa-panel-soft inline-flex h-8 w-8 items-center justify-center rounded-full"><Info size={13} className="text-[var(--wa-info)]" /></div>}
                  <span className={`text-[11px] font-modern font-semibold uppercase tracking-[0.18em] ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
                    {msg.role === 'mestre' ? 'Mestre Criador' : msg.role === 'sistema' ? 'Sistema' : 'Voce'}
                  </span>
                </div>

                <div className={wrapperClass}>
                  {isUltimaMensagemMestre && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em] ${
                        ['resumo', 'refinamento'].includes(etapaAtual) ? 'wa-emerald-chip' : etapaAtual === 'atributos' ? 'wa-brass-chip' : 'wa-violet-chip'
                      }`}>
                        {getStageLabel(etapaAtual)}
                      </span>
                    </div>
                  )}

                  <div className={`text-[15px] font-modern leading-relaxed ${isSistema ? (isLight ? 'text-blue-700' : 'text-blue-200') : isJogador ? 'text-white' : isLight ? 'text-slate-700' : 'text-slate-100'}`}>
                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                  </div>
                </div>

                {msg.sugestoes?.some(s => s.tipo === 'nome') && (
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

                {msg.sugestoes?.some(s => s.tipo === 'background') && (
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

                {msg.sugestoes?.some(s => !['nome', 'background'].includes(s.tipo)) && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5">
                    {msg.sugestoes.filter(s => !['nome', 'background'].includes(s.tipo)).map((sug, i) => (
                      <SuggestionCard
                        key={`${sug.id}-${i}`}
                        sugestao={sug}
                        onSelect={onSelecionarSugestao}
                        isLight={isLight}
                        selected={isSugestaoSelecionada(sug)}
                        variant="atelier"
                      />
                    ))}
                  </div>
                )}

                {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && !enviando && ['raca', 'classe', 'vantagens', 'desvantagens', 'background'].includes(etapaAtual) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEnviar('Mostre-me outras opcoes diferentes')}
                      className="wa-panel-soft inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Novas leituras
                    </button>

                    {mostrarBusca && (
                      <button
                        type="button"
                        onClick={() => { setBuscaAberta(prev => !prev); setFiltro(''); }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-modern font-medium transition-all cursor-pointer ${buscaAberta ? 'wa-violet-chip' : 'wa-panel-soft hover:-translate-y-0.5'}`}
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
                      <div className="wa-panel-soft rounded-[22px] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Shield size={16} className="text-[var(--wa-emerald)]" />
                          <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Atributos confirmados</span>
                          <CheckCircle2 size={14} className="ml-auto text-[var(--wa-emerald)]" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries({ forca: 'FOR', destreza: 'DES', constituicao: 'CON', inteligencia: 'INT', agilidade: 'AGI', carisma: 'CAR' }).map(([key, abbr]) => {
                            const val = atributos[key] || 10;
                            const bonus = bonusDetalhes?.[key] || 0;
                            const finalVal = val + bonus;
                            const mod = Math.floor((finalVal - 10) / 2);
                            return (
                              <div key={key} className={`rounded-xl border px-2.5 py-2 ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}>
                                <div className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{abbr}</div>
                                <div className={`mt-1 text-base font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{finalVal}</div>
                                <div className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>{mod >= 0 ? '+' : ''}{mod}{bonus !== 0 ? ` · ${bonus > 0 ? '+' : ''}${bonus}` : ''}</div>
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
                          <Info size={14} className="mt-0.5 shrink-0 text-[var(--wa-info)]" />
                          <span>
                            Estes sao os pontos base. Bonus de linhagem, vocacao, dons e marcas entram automaticamente depois da confirmacao.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {msg.role === 'mestre' && msgIndex === mensagens.length - 1 && mostrarBusca && buscaAberta && (
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
                          const isSelected = (tipoAtual === 'vantagem' && vantagensIds.includes(item.id)) || (tipoAtual === 'desvantagem' && desvantagensIds.includes(item.id));
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
                                {isSelected && <Check size={12} className="text-[var(--wa-violet)]" />}
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
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-violet)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-brass)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-[var(--wa-emerald)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                    O Mestre consulta os registros da forja...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {['resumo', 'refinamento'].includes(etapaAtual) && podeCriar && !enviando && (
          <div className="wa-readiness-panel rounded-[24px] border p-4 text-center">
            <CheckCircle2 size={30} className="mx-auto mb-2 text-[var(--wa-emerald)]" />
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

      <form onSubmit={handleSubmit} className="wa-dock border-t border-[var(--wa-border)] p-4 md:px-5">
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
                ? 'border-slate-200 bg-white/90 text-slate-800 placeholder-slate-400 focus:border-[var(--wa-violet)]'
                : 'border-slate-700 bg-slate-950/70 text-white placeholder-slate-500 focus:border-[var(--wa-violet)]'
            }`}
            style={{ maxHeight: '132px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 132)}px`;
            }}
          />

          <button
            type="submit"
            disabled={!inputTexto.trim() || enviando}
            className={`inline-flex h-[54px] w-[54px] items-center justify-center rounded-2xl transition-all cursor-pointer ${
              inputTexto.trim() && !enviando
                ? 'bg-gradient-to-br from-[var(--wa-brass)] via-[var(--wa-violet)] to-[var(--wa-violet)] text-white shadow-lg'
                : isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-slate-500'
            }`}
          >
            {enviando ? <Loader2 size={20} className="animate-spin" /> : etapaAtual === 'background' ? <ScrollText size={20} /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WizardChat;
