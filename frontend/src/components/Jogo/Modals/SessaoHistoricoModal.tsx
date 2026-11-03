import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Filter, Clock, Users, ScrollText, MessageCircle, Dice1, ArrowDown, Swords, Shield, TrendingUp, Package, Volume2, Square, Loader2, Mic } from 'lucide-react';
import { useTTS } from '../../../hooks/useTTS';
import ConfirmationModal from '../../ConfirmationModal';
import NarrationSegments, { buildNarrationSequenceItems } from '../../shared/NarrationSegments';

interface TipoConfigEntry {
  label: string;
  color: string;
  icon: string;
}

const tipoConfig: Record<string, TipoConfigEntry> = {
  mestre: { label: 'Mestre', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '\u{1F3AD}' },
  roleplay: { label: 'Roleplay', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '\u{1F4AC}' },
  dado: { label: 'Dados', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '\u{1F3B2}' },
  combate: { label: 'Combate', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '\u{2694}\u{FE0F}' },
  entre_rodadas: { label: 'Transicao', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: '\u{1F4D6}' },
};

function formatTimestamp(ts?: string | number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start?: string | number | null, end?: string | number | null): string {
  if (!start) return '-';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e.getTime() - s.getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}min`;
  return `${Math.floor(diff / 60)}h ${diff % 60}min`;
}

function formatDate(dateStr?: string | number | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface JogadorEntry {
  personagemNome?: string;
  username?: string;
  nome?: string;
}

function getParticipantes(jogadores?: JogadorEntry[] | Record<string, JogadorEntry> | null): string[] {
  if (!jogadores) return [];
  const list: JogadorEntry[] = Array.isArray(jogadores) ? jogadores : Object.values(jogadores);
  return list.map((j) => j?.personagemNome || j?.username || j?.nome || 'Jogador');
}

interface HistoricoMensagem {
  id?: string | number;
  tipo?: string;
  mensagem?: string;
  message?: string;
  conteudo?: string;
  voice_id?: string;
  voice_provider?: string;
  segmentos?: unknown[];
  audio_cache_key?: string;
  audio_url?: string;
  audioUrl?: string;
  timestamp?: string | number;
  username?: string;
  npc_nome?: string;
  speech_text?: string;
  [key: string]: unknown;
}

function getConteudo(msg: HistoricoMensagem): string {
  return msg.mensagem || msg.message || msg.conteudo || '';
}

interface MensagemItemProps {
  msg: HistoricoMensagem;
  tts: ReturnType<typeof useTTS>;
}

const MensagemItem = ({ msg, tts }: MensagemItemProps) => {
  const tipo = msg.tipo || 'roleplay';
  const config = tipoConfig[tipo] || tipoConfig.roleplay;
  const conteudo = getConteudo(msg);
  const [showConfirmAudio, setShowConfirmAudio] = useState(false);

  if (tipo === 'mestre') {
    const voiceId = msg.voice_id;
    const voiceProvider = msg.voice_provider;
    const sequenceKey = `historico:${msg.id ?? ''}`;
    const segmentItems = buildNarrationSequenceItems(
      (msg.segmentos as unknown as Parameters<typeof buildNarrationSequenceItems>[0]) || [],
      msg.id ?? '',
      voiceId,
      voiceProvider,
    );
    const hasSegmentedNarration = segmentItems.length > 0;
    const isThisSequenceActive = tts?.currentSequenceKey === sequenceKey;
    const isThisPlaying = Boolean(isThisSequenceActive ? tts?.isPlaying : String(tts?.currentMessageId) === String(msg.id) && tts?.isPlaying);
    const isThisLoading = Boolean(
      String(tts?.loadingTargetId || '') === String(msg.id)
      && (!hasSegmentedNarration || tts?.loadingSequenceKey === sequenceKey)
      && !tts?.canTogglePlayback
      && !isThisSequenceActive
    );
    const isWaitingNextAudio = Boolean(
      hasSegmentedNarration
      && isThisSequenceActive
      && !tts?.isPlaying
      && !tts?.canTogglePlayback
    );
    const hasCachedAudio = msg.id != null ? !!tts?.hasAudioForMessage?.(msg.id) : false;
    const hasPersistedAudio = Boolean(
      msg.audio_cache_key
      || msg.audio_url
      || msg.audioUrl
      || segmentItems.some((segment) => segment.hasPersistedAudio)
    );
    const hasAnyAudio = hasCachedAudio || hasPersistedAudio;
    const hasVoiceControls = Boolean(voiceId || segmentItems.some((segment) => segment.voiceId));

    const handlePlayAudio = async () => {
      if (!tts) return;
      if (isThisPlaying) {
        tts.togglePause();
        return;
      }

      if (hasSegmentedNarration) {
        await tts.playSequence(segmentItems as unknown as Parameters<typeof tts.playSequence>[0], msg.id ?? '', {
          allowGenerate: hasPersistedAudio,
          sequenceKey,
        });
        return;
      }

      if (!voiceId) return;

      await tts.play(conteudo, voiceId, msg.id ?? '', voiceProvider, {
        allowGenerate: hasPersistedAudio,
        speechText: msg.speech_text || conteudo,
      });
    };

    const handleGenerateAudio = () => {
      if (!tts) return;
      setShowConfirmAudio(true);
    };

    const confirmarGerarAudio = async () => {
      setShowConfirmAudio(false);

      if (hasSegmentedNarration) {
        await tts.playSequence(segmentItems as unknown as Parameters<typeof tts.playSequence>[0], msg.id ?? '', {
          allowGenerate: true,
          forceRegenerate: hasAnyAudio,
          sequenceKey,
        });
        return;
      }

      if (!voiceId) return;

      await tts.play(conteudo, voiceId, msg.id ?? '', voiceProvider, {
        allowGenerate: true,
        forceRegenerate: hasAnyAudio,
        speechText: msg.speech_text || conteudo,
      });
    };

    return (
      <div className="glass p-3 rounded-lg border border-purple-500/20 ml-0">
        <ConfirmationModal
          isOpen={showConfirmAudio}
          onClose={() => setShowConfirmAudio(false)}
          onConfirm={confirmarGerarAudio}
          title="Gerar Audio"
          message={hasAnyAudio ? 'Ja existe audio para esta mensagem. Deseja gerar novamente?' : 'Deseja gerar audio para esta mensagem?'}
          confirmText="Gerar"
          cancelText="Cancelar"
          type="info"
        />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">{config.icon}</span>
          <span className="text-xs font-semibold text-purple-300 font-modern">Mestre</span>
          {hasVoiceControls && tts && (
            <>
              <button
                onClick={handlePlayAudio}
                disabled={!hasAnyAudio || isThisLoading || isWaitingNextAudio}
                className={`p-0.5 rounded transition-all ${
                  !hasAnyAudio
                    ? 'text-purple-400/40 cursor-not-allowed'
                    : 'text-purple-400 hover:text-purple-200'
                }`}
                title={isThisLoading || isWaitingNextAudio ? 'Preparando audio' : isThisPlaying ? 'Pausar' : hasSegmentedNarration ? 'Ouvir cena' : 'Ouvir'}
              >
                {isThisLoading || isWaitingNextAudio ? <Loader2 size={12} className="animate-spin" /> : isThisPlaying ? <Square size={12} /> : <Volume2 size={12} />}
              </button>
              <button
                onClick={handleGenerateAudio}
                disabled={isThisLoading}
                className="p-0.5 rounded transition-all text-purple-400 hover:text-purple-200"
                title={hasAnyAudio ? 'Gerar novamente (com confirmacao)' : 'Gerar audio'}
              >
                <Mic size={10} />
              </button>
            </>
          )}
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
        </div>
        {hasSegmentedNarration ? (
          <NarrationSegments
            segments={(msg.segmentos as unknown as Parameters<typeof NarrationSegments>[0]['segments']) || []}
            messageId={msg.id ?? ''}
            tts={tts as unknown as Parameters<typeof NarrationSegments>[0]['tts']}
            defaultVoiceId={voiceId}
            defaultVoiceProvider={voiceProvider}
            compact
            className="mt-1"
          />
        ) : (
          <div className="text-sm text-slate-200 font-modern whitespace-pre-wrap">{conteudo}</div>
        )}
      </div>
    );
  }

  if (tipo === 'dado') {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-xs">{'??'}</span>
        <span className="text-xs text-slate-400 font-modern">{msg.username || 'Jogador'}</span>
        <span className="text-sm font-bold text-amber-400">{(msg.dice as string) || conteudo}</span>
        {msg.result != null && <span className="text-lg font-bold text-amber-300">{'?'} {String(msg.result)}</span>}
        <span className="text-[10px] text-slate-500 ml-auto">{formatTimestamp(msg.timestamp)}</span>
      </div>
    );
  }

  if (tipo === 'combate') {
    return (
      <div className="glass p-2 rounded-lg border border-red-500/20">
        <div className="flex items-center gap-2">
          <span className="text-xs">{'??'}</span>
          <span className="text-sm text-red-300 font-modern">{conteudo}</span>
          {Boolean(msg.dano) && <span className="text-sm font-bold text-red-400">-{String(msg.dano)} HP</span>}
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

interface HistoricoPersonagem {
  nome?: string;
  classe_nome?: string;
  raca_nome?: string;
  status?: string;
  nivel_inicio?: number;
  nivel_fim?: number;
  itens_ganhos?: Array<{ nome?: string }>;
  itens_perdidos?: Array<{ nome?: string }>;
  xp_ganho?: number;
  abandonado_em?: string | null;
  derrotado_em?: string | null;
  [key: string]: unknown;
}

const PersonagemCard = ({ personagem }: { personagem: HistoricoPersonagem }) => {
  const levelUp = personagem.nivel_fim && personagem.nivel_inicio && personagem.nivel_fim > personagem.nivel_inicio;
  const itensGanhos = Array.isArray(personagem.itens_ganhos) ? personagem.itens_ganhos : [];
  const itensPerdidos = Array.isArray(personagem.itens_perdidos) ? personagem.itens_perdidos : [];

  return (
    <div className="glass rounded-lg border border-slate-700/50 p-4">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div className="glass rounded px-3 py-2 border border-slate-700/30">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-blue-400" />
            <span className="text-[10px] text-slate-400 font-modern uppercase">Nivel</span>
          </div>
          <div className="text-sm font-modern font-semibold text-white mt-0.5">
            {personagem.nivel_inicio || 1}
            {levelUp && (
              <span className="text-green-400"> {'\u{2192}'} {personagem.nivel_fim}</span>
            )}
          </div>
        </div>

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

        {((personagem.hp_max as number | undefined) ?? 0) > 0 && (
          <div className="glass rounded px-3 py-2 border border-slate-700/30">
            <div className="flex items-center gap-1.5">
              <Swords size={12} className="text-red-400" />
              <span className="text-[10px] text-slate-400 font-modern uppercase">HP Final</span>
            </div>
            <div className="text-sm font-modern font-semibold text-white mt-0.5">
              {String(personagem.hp_atual ?? '')}/{String(personagem.hp_max ?? '')}
            </div>
          </div>
        )}
      </div>

      {itensGanhos.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Package size={12} className="text-green-400" />
            <span className="text-[10px] text-green-400 font-modern uppercase font-semibold">Itens Ganhos</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {itensGanhos.map((item, i) => {
              const it = item as { nome?: string; itemNome?: string; quantidade?: number };
              return (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-300 border border-green-500/20 font-modern">
                  {it.nome || it.itemNome || 'Item'}
                  {(it.quantidade ?? 0) > 1 && ` x${it.quantidade}`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {itensPerdidos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Package size={12} className="text-red-400" />
            <span className="text-[10px] text-red-400 font-modern uppercase font-semibold">Itens Perdidos</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {itensPerdidos.map((item, i) => {
              const it = item as { nome?: string; itemNome?: string };
              return (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-modern">
                  {it.nome || it.itemNome || 'Item'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface SessaoHistorico {
  id?: string | number;
  status?: string;
  nome?: string;
  iniciada_em?: string | number;
  finalizada_em?: string | number;
  duracao?: string;
  participantes?: number;
  resumo?: string;
  jogadores?: JogadorEntry[] | Record<string, JogadorEntry>;
  mensagens?: HistoricoMensagem[];
  personagens?: HistoricoPersonagem[];
  [key: string]: unknown;
}

interface SessaoHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessao?: SessaoHistorico | null;
}

type AbaAtiva = 'mensagens' | 'resumo' | 'personagens';

const SessaoHistoricoModal = ({ isOpen, onClose, sessao }: SessaoHistoricoModalProps) => {
  const [filtros, setFiltros] = useState<Set<string>>(new Set());
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('mensagens');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const tts = useTTS();

  const mensagens = useMemo(() => {
    const msgs = Array.isArray(sessao?.mensagens) ? sessao.mensagens : [];
    if (filtros.size === 0) return msgs;
    return msgs.filter((m) => m.tipo != null && filtros.has(m.tipo));
  }, [sessao?.mensagens, filtros]);

  const personagens = useMemo(() => {
    return Array.isArray(sessao?.personagens) ? sessao.personagens : [];
  }, [sessao?.personagens]);

  const toggleFiltro = (tipo: string) => {
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

  useEffect(() => {
    if (isOpen) setAbaAtiva('mensagens');
  }, [isOpen]);

  if (!isOpen || !sessao) return null;

  const participantes = getParticipantes(sessao.jogadores);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4 my-4 bg-slate-900/95 backdrop-blur-md rounded-xl border border-purple-500/20 flex flex-col overflow-hidden">
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
              <Dice1 size={12} /> {Number((sessao as { rodada_atual?: number }).rodada_atual ?? 0)} rodadas
            </span>
            {participantes.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={12} /> {participantes.join(', ')}
              </span>
            )}
          </div>

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
                {personagens.map((p) => <PersonagemCard key={String((p as { id?: string | number }).id ?? p.nome ?? Math.random())} personagem={p} />)}
              </div>
            )
          )}
        </div>

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
