import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter, Clock, Users, ScrollText, MessageCircle, Dice1, ArrowDown, Swords, Shield, TrendingUp, Package, Volume2, Square, Loader2 } from 'lucide-react';
import { useTTS } from '../../../hooks/useTTS.js';

const tipoConfig = {
  mestre: { label: 'Mestre', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '🎭' },
  roleplay: { label: 'Roleplay', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '💬' },
  dado: { label: 'Dados', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '🎲' },
  combate: { label: 'Combate', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '⚔️' },
  entre_rodadas: { label: 'Transição', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: '📖' },
};

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start, end) {
  if (!start) return '—';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - s) / 1000 / 60);
  if (diff < 60) return `${diff}min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}min`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getParticipantes(jogadores) {
  if (!jogadores) return [];
  if (Array.isArray(jogadores)) return jogadores;
  return Object.values(jogadores).map(j => j.personagemNome || j.username || j.nome || 'Jogador');
}

/** Extrai texto da mensagem (backend salva como 'mensagem', emit usa 'message') */
function getConteudo(msg) {
  return msg.mensagem || msg.message || msg.conteudo || '';
}

const MensagemItem = ({ msg, tts }) => {
  const tipo = msg.tipo || 'roleplay';
  const config = tipoConfig[tipo] || tipoConfig.roleplay;
  const conteudo = getConteudo(msg);

  if (tipo === 'mestre') {
    const voiceId = msg.voice_id;
    const voiceProvider = msg.voice_provider;
    const isThisPlaying = tts?.currentMessageId === msg.id;
    const hasCachedAudio = !!tts?.hasAudioForMessage?.(msg.id);
    const hasPersistedAudio = Boolean(msg.audio_cache_key || msg.audio_url || msg.audioUrl);
    const hasAnyAudio = hasCachedAudio || hasPersistedAudio;

    const handlePlayAudio = async () => {
      if (!voiceId || !tts) return;
      if (isThisPlaying) {
        tts.togglePause();
        return;
      }
      await tts.play(conteudo, voiceId, msg.id, voiceProvider, { allowGenerate: hasPersistedAudio });
    };

    const handleGenerateAudio = async () => {
      if (!voiceId || !tts) return;
      const confirmed = hasAnyAudio
        ? window.confirm('Ja existe audio para esta mensagem. Deseja gerar novamente?')
        : window.confirm('Deseja gerar audio para esta mensagem?');
      if (!confirmed) return;
      await tts.play(conteudo, voiceId, msg.id, voiceProvider, { allowGenerate: true, forceRegenerate: hasAnyAudio });
    };

    return (
      <div className="glass p-3 rounded-lg border border-purple-500/20 ml-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs">{config.icon}</span>
          <span className="text-xs font-semibold text-purple-300 font-modern">Mestre</span>
          {voiceId && tts && (
            <>
              <button
                onClick={handlePlayAudio}
                disabled={!hasAnyAudio || (tts.isLoading && isThisPlaying)}
                className={`p-0.5 rounded transition-all ${
                  !hasAnyAudio
                    ? 'text-purple-400/40 cursor-not-allowed'
                    : 'text-purple-400 hover:text-purple-200'
                }`}
                title={isThisPlaying && tts.isPlaying ? 'Pausar' : 'Ouvir'}
              >
                {tts.isLoading && isThisPlaying ? <Loader2 size={12} className="animate-spin" /> : isThisPlaying && tts.isPlaying ? <Square size={12} /> : <Volume2 size={12} />}
              </button>
              <button
                onClick={handleGenerateAudio}
                disabled={tts.isLoading && isThisPlaying}
                className="p-0.5 rounded transition-all text-purple-400 hover:text-purple-200"
                title={hasAnyAudio ? 'Gerar novamente (com confirmacao)' : 'Gerar audio'}
              >
                <span className="text-[10px]">{'\u{1F3A4}'}</span>
              </button>
            </>
          )}
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
        </div>
        <div className="text-sm text-slate-200 font-modern whitespace-pre-wrap">{conteudo}</div>
      </div>
    );
  }

  if (tipo === 'dado') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-xs">🎲</span>
        <span className="text-xs text-slate-400 font-modern">{msg.username || 'Jogador'}</span>
        <span className="text-sm font-bold text-amber-400">{msg.dice || conteudo}</span>
        {msg.result != null && <span className="text-lg font-bold text-amber-300">→ {msg.result}</span>}
        <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
      </div>
    );
  }

  if (tipo === 'combate') {
    return (
      <div className="glass p-2 rounded-lg border border-red-500/20">
        <div className="flex items-center gap-2">
          <span className="text-xs">⚔️</span>
          <span className="text-sm text-red-300 font-modern">{conteudo}</span>
          {msg.dano && <span className="text-sm font-bold text-red-400">-{msg.dano} HP</span>}
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
        </div>
      </div>
    );
  }

  if (tipo === 'entre_rodadas') {
    return (
      <div className="glass p-2 rounded-lg border border-cyan-500/20 text-center">
        <span className="text-xs text-cyan-300 font-modern">{conteudo}</span>
      </div>
    );
  }

  // roleplay / default
  return (
    <div className="py-1">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-semibold text-cyan-300 font-modern">{msg.username || 'Jogador'}</span>
        <span className="text-[10px] text-slate-500">{formatTimestamp(msg.timestamp)}</span>
      </div>
      <div className="text-sm text-slate-300 font-modern italic">{conteudo}</div>
    </div>
  );
};

const PersonagemCard = ({ personagem }) => {
  const levelUp = personagem.nivel_fim && personagem.nivel_inicio && personagem.nivel_fim > personagem.nivel_inicio;
  const itensGanhos = Array.isArray(personagem.itens_ganhos) ? personagem.itens_ganhos : [];
  const itensPerdidos = Array.isArray(personagem.itens_perdidos) ? personagem.itens_perdidos : [];

  return (
    <div className="glass rounded-lg border border-slate-700/50 p-4">
      {/* Header: nome + classe/raca */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-fantasy font-bold text-white">{personagem.nome}</h4>
          <p className="text-xs text-slate-400 font-modern">
            {[personagem.classe_nome, personagem.raca_nome].filter(Boolean).join(' - ') || 'Classe/Raca desconhecida'}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border font-modern ${
          personagem.status === 'finalizada'
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : personagem.status === 'abandonada'
            ? 'bg-red-500/20 text-red-300 border-red-500/30'
            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        }`}>
          {personagem.status === 'finalizada' ? 'Finalizado' : personagem.status === 'abandonada' ? 'Abandonado' : 'Ativo'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {/* Nivel */}
        <div className="glass rounded px-3 py-2 border border-slate-700/30">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-blue-400" />
            <span className="text-[10px] text-slate-400 font-modern uppercase">Nivel</span>
          </div>
          <div className="text-sm font-modern font-semibold text-white mt-0.5">
            {personagem.nivel_inicio || 1}
            {levelUp && (
              <span className="text-green-400"> → {personagem.nivel_fim}</span>
            )}
          </div>
        </div>

        {/* XP Ganho */}
        <div className="glass rounded px-3 py-2 border border-slate-700/30">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-yellow-400" />
            <span className="text-[10px] text-slate-400 font-modern uppercase">XP Ganho</span>
          </div>
          <div className={`text-sm font-modern font-semibold mt-0.5 ${
            (personagem.xp_ganho || 0) > 0 ? 'text-yellow-400' : 'text-slate-500'
          }`}>
            +{personagem.xp_ganho || 0}
          </div>
        </div>

        {/* HP */}
        {personagem.hp_max > 0 && (
          <div className="glass rounded px-3 py-2 border border-slate-700/30">
            <div className="flex items-center gap-1.5">
              <Swords size={12} className="text-red-400" />
              <span className="text-[10px] text-slate-400 font-modern uppercase">HP Final</span>
            </div>
            <div className="text-sm font-modern font-semibold text-white mt-0.5">
              {personagem.hp_atual}/{personagem.hp_max}
            </div>
          </div>
        )}
      </div>

      {/* Itens ganhos */}
      {itensGanhos.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Package size={12} className="text-green-400" />
            <span className="text-[10px] text-green-400 font-modern uppercase font-semibold">Itens Ganhos</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {itensGanhos.map((item, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-300 border border-green-500/20 font-modern">
                {item.nome || item.itemNome || 'Item'}
                {item.quantidade > 1 && ` x${item.quantidade}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Itens perdidos */}
      {itensPerdidos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Package size={12} className="text-red-400" />
            <span className="text-[10px] text-red-400 font-modern uppercase font-semibold">Itens Perdidos</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {itensPerdidos.map((item, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-modern">
                {item.nome || item.itemNome || 'Item'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Modal fullscreen para visualizar historico de uma sessao
 */
const SessaoHistoricoModal = ({ isOpen, onClose, sessao }) => {
  const [filtros, setFiltros] = useState(new Set());
  const [abaAtiva, setAbaAtiva] = useState('mensagens');
  const scrollRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const tts = useTTS();

  const mensagens = useMemo(() => {
    const msgs = Array.isArray(sessao?.mensagens) ? sessao.mensagens : [];
    if (filtros.size === 0) return msgs;
    return msgs.filter(m => filtros.has(m.tipo));
  }, [sessao?.mensagens, filtros]);

  const personagens = useMemo(() => {
    return Array.isArray(sessao?.personagens) ? sessao.personagens : [];
  }, [sessao?.personagens]);

  const toggleFiltro = (tipo) => {
    setFiltros(prev => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isOpen, abaAtiva]);

  // Reset aba ao abrir novo modal
  useEffect(() => {
    if (isOpen) setAbaAtiva('mensagens');
  }, [isOpen]);

  if (!isOpen || !sessao) return null;

  const participantes = getParticipantes(sessao.jogadores);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4 my-4 bg-slate-900/95 backdrop-blur-md rounded-xl border border-purple-500/20 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ScrollText size={20} className="text-purple-400" />
              <h2 className="text-lg font-fantasy font-bold text-white">Historico da Sessao</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-modern">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDate(sessao.iniciada_em)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> Duracao: {formatDuration(sessao.iniciada_em, sessao.finalizada_em)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {(sessao.mensagens || []).length} mensagens
            </span>
            <span className="flex items-center gap-1">
              <Dice1 size={12} /> {sessao.rodada_atual || 0} rodadas
            </span>
            {participantes.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={12} /> {participantes.join(', ')}
              </span>
            )}
          </div>

          {/* Status badge */}
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded border font-modern ${
              sessao.status === 'finalizada'
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            }`}>
              {sessao.status === 'finalizada' ? 'Finalizada' : 'Em andamento'}
            </span>
          </div>
        </div>

        {/* Abas */}
        <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-1">
          <button
            onClick={() => setAbaAtiva('mensagens')}
            className={`text-sm px-3 py-1.5 rounded font-modern transition-all ${
              abaAtiva === 'mensagens'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle size={14} className="inline mr-1.5" />
            Mensagens
          </button>
          <button
            onClick={() => setAbaAtiva('personagens')}
            className={`text-sm px-3 py-1.5 rounded font-modern transition-all ${
              abaAtiva === 'personagens'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} className="inline mr-1.5" />
            Personagens
            {personagens.length > 0 && (
              <span className="ml-1.5 text-xs bg-slate-700/50 px-1.5 py-0.5 rounded">{personagens.length}</span>
            )}
          </button>
        </div>

        {/* Aba Mensagens: Filtros */}
        {abaAtiva === 'mensagens' && (
          <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-slate-400" />
            {Object.entries(tipoConfig).map(([tipo, config]) => (
              <button
                key={tipo}
                onClick={() => toggleFiltro(tipo)}
                className={`text-xs px-2 py-1 rounded border font-modern transition-all ${
                  filtros.size === 0 || filtros.has(tipo)
                    ? config.color
                    : 'bg-slate-800/30 text-slate-600 border-slate-700/30'
                }`}
              >
                {config.icon} {config.label}
              </button>
            ))}
            {filtros.size > 0 && (
              <button
                onClick={() => setFiltros(new Set())}
                className="text-xs text-slate-500 hover:text-slate-300 font-modern"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {abaAtiva === 'mensagens' ? (
            mensagens.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-modern">
                {filtros.size > 0 ? 'Nenhuma mensagem com os filtros selecionados' : 'Nenhuma mensagem nesta sessao'}
              </div>
            ) : (
              mensagens.map((msg, i) => <MensagemItem key={msg.id || i} msg={msg} tts={tts} />)
            )
          ) : (
            personagens.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-modern">
                Nenhum personagem registrado nesta sessao
              </div>
            ) : (
              <div className="grid gap-3">
                {personagens.map(p => <PersonagemCard key={p.id} personagem={p} />)}
              </div>
            )
          )}
        </div>

        {/* Scroll to bottom (only on messages tab) */}
        {abaAtiva === 'mensagens' && showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 p-2 rounded-full glass border border-purple-500/30 text-purple-400 hover:text-white transition-colors"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SessaoHistoricoModal;
