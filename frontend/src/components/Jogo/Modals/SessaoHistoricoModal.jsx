import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter, Clock, Users, ScrollText, MessageCircle, Sword, Dice1, ArrowDown } from 'lucide-react';

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

const MensagemItem = ({ msg }) => {
  const tipo = msg.tipo || 'roleplay';
  const config = tipoConfig[tipo] || tipoConfig.roleplay;

  if (tipo === 'mestre') {
    return (
      <div className="glass p-3 rounded-lg border border-purple-500/20 ml-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs">{config.icon}</span>
          <span className="text-xs font-semibold text-purple-300 font-modern">Mestre</span>
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
        </div>
        <div className="text-sm text-slate-200 font-modern whitespace-pre-wrap">{msg.message || msg.conteudo}</div>
      </div>
    );
  }

  if (tipo === 'dado') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-xs">🎲</span>
        <span className="text-xs text-slate-400 font-modern">{msg.username || 'Jogador'}</span>
        <span className="text-sm font-bold text-amber-400">{msg.dice || msg.message}</span>
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
          <span className="text-sm text-red-300 font-modern">{msg.message || msg.conteudo}</span>
          {msg.dano && <span className="text-sm font-bold text-red-400">-{msg.dano} HP</span>}
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
        </div>
      </div>
    );
  }

  if (tipo === 'entre_rodadas') {
    return (
      <div className="glass p-2 rounded-lg border border-cyan-500/20 text-center">
        <span className="text-xs text-cyan-300 font-modern">{msg.message || msg.conteudo}</span>
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
      <div className="text-sm text-slate-300 font-modern italic">{msg.message || msg.conteudo}</div>
    </div>
  );
};

/**
 * Modal fullscreen para visualizar historico de uma sessao
 */
const SessaoHistoricoModal = ({ isOpen, onClose, sessao }) => {
  const [filtros, setFiltros] = useState(new Set());
  const scrollRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const mensagens = useMemo(() => {
    const msgs = Array.isArray(sessao?.mensagens) ? sessao.mensagens : [];
    if (filtros.size === 0) return msgs;
    return msgs.filter(m => filtros.has(m.tipo));
  }, [sessao?.mensagens, filtros]);

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
              <h2 className="text-lg font-fantasy font-bold text-white">Histórico da Sessão</h2>
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
              <Clock size={12} /> Duração: {formatDuration(sessao.iniciada_em, sessao.finalizada_em)}
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

        {/* Filtros */}
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

        {/* Mensagens */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
          {mensagens.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-modern">
              {filtros.size > 0 ? 'Nenhuma mensagem com os filtros selecionados' : 'Nenhuma mensagem nesta sessão'}
            </div>
          ) : (
            mensagens.map((msg, i) => <MensagemItem key={msg.id || i} msg={msg} />)
          )}
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
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
