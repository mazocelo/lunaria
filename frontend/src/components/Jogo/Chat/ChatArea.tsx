import { useRef, useEffect, useMemo, type ReactNode } from 'react';
import { ListMusic, Loader2, Pause, Play, ScrollText, SkipBack, SkipForward, Square, Volume2 } from 'lucide-react';
import { RPGMessage } from '../../RPGMessage';
import { MESSAGE_RENDERERS, MestreMessage, MestreMessageGroup, JogadorMessage, type ChatMensagem, type EntidadeComImagem, type ContextoImagemCena } from './renderers';
import { useTTS } from '../../../hooks/useTTS';
import { buildNarrationSequenceItems, type NarrationTrackItem } from '../../shared/NarrationSegments';
import { buildTtsItemKey } from '../../../utils/ttsKeys';
import AudioQueuePopover from '../../../audio/ui/AudioQueuePopover.jsx';

const GAME_AUDIO_SOURCES = new Set(['chat_global', 'message_balloon', 'message_group', 'game_segment']);

type MessageGroup =
  | { type: 'single'; mensagem: ChatMensagem }
  | { type: 'mestre_group'; mensagens: ChatMensagem[] };

function groupConsecutiveMessages(mensagens: ChatMensagem[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentMestreGroup: ChatMensagem[] = [];

  for (const msg of mensagens) {
    const m = msg as { tipo?: string; type?: string };
    const tipo = m.tipo || m.type;
    if (tipo === 'mestre') {
      currentMestreGroup.push(msg);
      continue;
    }

    if (currentMestreGroup.length > 0) {
      groups.push(
        currentMestreGroup.length === 1
          ? { type: 'single', mensagem: currentMestreGroup[0] }
          : { type: 'mestre_group', mensagens: [...currentMestreGroup] },
      );
      currentMestreGroup = [];
    }

    groups.push({ type: 'single', mensagem: msg });
  }

  if (currentMestreGroup.length > 0) {
    groups.push(
      currentMestreGroup.length === 1
        ? { type: 'single', mensagem: currentMestreGroup[0] }
        : { type: 'mestre_group', mensagens: [...currentMestreGroup] },
    );
  }

  return groups;
}

interface ChatAreaProps {
  mensagens: ChatMensagem[];
  usuariosDigitando: Array<{ username?: string; nome?: string }>;
  voiceId?: string | null;
  voiceProvider?: string;
  entidadesComImagem?: EntidadeComImagem[];
  contextoImagemCena?: ContextoImagemCena;
  onSceneImageGenerated?: (id: string | number, url: string) => void;
  estiloImagem?: string | null;
  prologo?: string | null;
  imagemCapa?: string | null;
}

const ChatArea = ({
  mensagens,
  usuariosDigitando,
  voiceId,
  voiceProvider,
  entidadesComImagem,
  contextoImagemCena,
  onSceneImageGenerated,
  estiloImagem,
  prologo,
  imagemCapa,
}: ChatAreaProps) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const tts = useTTS();

  const currentTtsMessage = useMemo(
    () => mensagens.find((m) => String(m.id) === String(tts.currentMessageId)),
    [mensagens, tts.currentMessageId]
  );

  type Segmento = { id?: string | number; speakerLabel?: string; text?: string };
  const currentTtsSegment = useMemo(
    () => {
      const segmentos = ((currentTtsMessage as { segmentos?: Segmento[] } | undefined)?.segmentos) || [];
      return segmentos.find((segmento) => String(segmento.id) === String(tts.currentSegmentId)) || null;
    },
    [currentTtsMessage, tts.currentSegmentId],
  );

  const groupedMessages = useMemo(() => groupConsecutiveMessages(mensagens), [mensagens]);

  type LocalSequenceItem = NarrationTrackItem & { speech_text?: string | null };
  const mestreNarrationItems = useMemo<LocalSequenceItem[]>(() => {
    const items: LocalSequenceItem[] = [];

    if (prologo && voiceId) {
      const trackId = buildTtsItemKey('prologo', null, voiceId, voiceProvider, null, prologo);
      items.push({
        trackId,
        itemKey: trackId,
        messageId: 'prologo',
        segmentId: null,
        text: prologo,
        speechText: prologo,
        speech_text: prologo,
        voiceId,
        provider: voiceProvider || 'elevenlabs',
        emotion: null,
        speakerLabel: 'Prologo',
        kind: 'narracao',
        tipo: 'narracao',
        hasPersistedAudio: false,
      });
    }

    (Array.isArray(mensagens) ? mensagens : []).forEach((mensagem) => {
      const m = mensagem as Record<string, unknown> & {
        tipo?: string;
        type?: string;
        voice_id?: string;
        voice_provider?: string;
        id?: string | number;
        message?: string;
        mensagem?: string;
        speech_text?: string;
        npc_nome?: string;
        segmentos?: unknown[];
        audio_cache_key?: string;
        audio_url?: string;
        audioUrl?: string;
      };
      const tipo = m.tipo || m.type;
      if (tipo !== 'mestre') return;

      const effectiveVoiceId: string | null = m.voice_id || voiceId || null;
      const effectiveVoiceProvider: string = m.voice_provider || voiceProvider || 'elevenlabs';
      const segmentItems = buildNarrationSequenceItems(
        (m.segmentos as unknown as Parameters<typeof buildNarrationSequenceItems>[0]) || [],
        m.id ?? '',
        effectiveVoiceId,
        effectiveVoiceProvider,
      );

      if (segmentItems.length > 0) { items.push(...segmentItems); return; }

      const text = String(m.message || m.mensagem || '').trim();
      if (!text || !effectiveVoiceId) return;

      const trackId = buildTtsItemKey(
        m.id ?? '',
        null,
        effectiveVoiceId,
        effectiveVoiceProvider,
        null,
        m.speech_text || text,
      );
      items.push({
        trackId,
        itemKey: trackId,
        messageId: m.id != null ? String(m.id) : null,
        segmentId: null,
        text,
        speechText: m.speech_text || text,
        speech_text: m.speech_text || null,
        voiceId: effectiveVoiceId,
        provider: effectiveVoiceProvider,
        emotion: null,
        speakerLabel: m.npc_nome || 'Mestre',
        kind: 'narracao',
        tipo: 'narracao',
        hasPersistedAudio: Boolean(m.audio_cache_key || m.audio_url || m.audioUrl),
      });
    });

    return items;
  }, [mensagens, voiceId, voiceProvider, prologo]);

  const globalNarrationSequenceKey = useMemo(() => (
    mestreNarrationItems.length > 0
      ? `chat-all:${mestreNarrationItems.map((item) => item.trackId || `${item.messageId}:${item.segmentId || ''}`).join('|')}`
      : null
  ), [mestreNarrationItems]);

  const globalNarrationOwnerId = useMemo(
    () => (globalNarrationSequenceKey ? `owner:${globalNarrationSequenceKey}` : null),
    [globalNarrationSequenceKey]
  );

  const isGlobalNarrationActive = Boolean(
    globalNarrationSequenceKey
    && tts.isSequence
    && tts.currentSequenceKey === globalNarrationSequenceKey
  );

  const isGlobalNarrationGenerating = Boolean(
    globalNarrationOwnerId
    && String(tts.generatingMessageId || '') === String(globalNarrationOwnerId)
  );
  const isGlobalNarrationLoading = Boolean(
    globalNarrationOwnerId
    && String(tts.loadingTargetId || '') === String(globalNarrationOwnerId)
    && tts.loadingSequenceKey === globalNarrationSequenceKey
    && !tts.canTogglePlayback
    && !isGlobalNarrationActive
  );
  const isGlobalNarrationWaiting = Boolean(
    isGlobalNarrationActive
    && tts.waitingForNext
  );
  const currentPlaylist = tts.currentPlaylist as { source?: string } | null | undefined;
  const currentTrack = tts.currentTrack as { meta?: { source?: string }; speakerLabel?: string; text?: string } | null | undefined;
  const isGameAudioContext = GAME_AUDIO_SOURCES.has(currentPlaylist?.source || currentTrack?.meta?.source || '');
  const canShowQueue = isGameAudioContext && (tts.queueItems?.length || 0) > 0;

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const min = Math.floor(safe / 60);
    const sec = String(safe % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    if (!canShowQueue && tts.queueOpen) {
      tts.setQueueOpen(false);
    }
  }, [canShowQueue, tts]);

  const handlePlayAllNarration = async () => {
    if (!mestreNarrationItems.length || !globalNarrationSequenceKey || !globalNarrationOwnerId) return;
    // playSequence do hook tem assinatura propria; cast defensivo p/ items
    await tts.playSequence(mestreNarrationItems as unknown as Parameters<typeof tts.playSequence>[0], globalNarrationOwnerId, {
      allowGenerate: true,
      sequenceKey: globalNarrationSequenceKey,
      title: 'Cena completa',
      source: 'chat_global',
      contextLabel: 'Narracao da cena',
    });
  };

  const ttsForMestre = tts as unknown as Parameters<typeof MestreMessage>[0]['tts'];
  const ttsForJogador = tts as unknown as Parameters<typeof JogadorMessage>[0]['tts'];

  const renderMensagem = (mensagem: ChatMensagem, index: number) => {
    const m = mensagem as { tipo?: string; type?: string; id?: string | number };
    const tipo = m.tipo || m.type;
    const key = m.id ?? index;

    if (tipo === 'mestre') {
      return (
        <MestreMessage
          key={key}
          mensagem={mensagem}
          voiceId={voiceId}
          voiceProvider={voiceProvider}
          tts={ttsForMestre}
          entidadesComImagem={entidadesComImagem}
          contextoImagemCena={contextoImagemCena}
          onSceneImageGenerated={onSceneImageGenerated}
          estiloImagem={estiloImagem}
        />
      );
    }

    if (tipo === 'jogador' || tipo === 'player') {
      return <JogadorMessage key={key} mensagem={mensagem} tts={ttsForJogador} />;
    }

    const renderer = tipo ? (MESSAGE_RENDERERS as Record<string, ((m: ChatMensagem, key: string | number) => ReactNode) | undefined>)[tipo] : null;
    if (renderer) return renderer(mensagem, key);

    return (
      <RPGMessage
        key={key}
        message={{ ...(mensagem as Record<string, unknown>), type: tipo } as Parameters<typeof RPGMessage>[0]['message']}
        className="animate-fade-in"
      />
    );
  };

  const currentLabel = currentTtsSegment
    ? `${(currentTtsSegment as { speaker_label?: string }).speaker_label || currentTtsSegment.speakerLabel || 'Trecho'}: ${currentTtsSegment.text || ''}`
    : currentTrack?.speakerLabel && currentTrack?.text
      ? `${currentTrack.speakerLabel}: ${currentTrack.text}`
      : (currentTtsMessage as { message?: string; mensagem?: string } | undefined)?.message
        || (currentTtsMessage as { message?: string; mensagem?: string } | undefined)?.mensagem
        || 'Narracao';

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {mestreNarrationItems.length > 0 && (
        <div className="px-6 pt-4 relative z-10 pointer-events-none">
          <div className="w-full max-w-4xl mx-auto flex justify-end">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={handlePlayAllNarration}
                disabled={isGlobalNarrationLoading || isGlobalNarrationGenerating || isGlobalNarrationWaiting}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full game-glass-subtle border border-purple-400/30 text-purple-100 text-sm hover:border-purple-400/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                title="Gerar e reproduzir toda a narracao do Mestre"
                aria-label="Gerar e reproduzir toda a narracao do Mestre"
              >
                {isGlobalNarrationGenerating || isGlobalNarrationLoading || isGlobalNarrationWaiting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isGlobalNarrationActive && tts.isPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
                <span>
                  {isGlobalNarrationGenerating || isGlobalNarrationLoading
                    ? 'Gerando cena'
                    : isGlobalNarrationWaiting
                      ? 'Preparando proximo trecho'
                    : isGlobalNarrationActive && tts.isPlaying
                      ? 'Pausar cena'
                      : isGlobalNarrationActive
                        ? 'Continuar cena'
                        : `Ouvir cena (${mestreNarrationItems.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-5 mb-6">
            {(prologo || imagemCapa) && (
              <div className="max-w-[88%] mx-auto animate-fade-in">
                <div className="game-glass p-5 rounded-2xl border border-purple-500/30 shadow-[0_0_24px_rgba(139,92,246,0.12)] overflow-hidden">
                  {imagemCapa && (
                    <img
                      src={imagemCapa}
                      alt="Capa da aventura"
                      className="w-full max-h-72 object-cover rounded-xl border border-purple-500/20 mb-4 select-none caret-transparent"
                      draggable={false}
                    />
                  )}
                  {prologo && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{'\u{1F4DC}'}</span>
                      <div className="flex-1">
                        <p className="font-fantasy text-xs uppercase tracking-widest text-purple-300/70 mb-2">
                          Prologo
                        </p>
                        <p className="text-white/90 text-base leading-relaxed italic">
                          {prologo}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mensagens.length > 0 ? (
              groupedMessages.map((group, idx) => {
                if (group.type === 'mestre_group') {
                  const firstId = (group.mensagens[0] as { id?: string | number }).id;
                  return (
                    <MestreMessageGroup
                      key={firstId ?? idx}
                      mensagens={group.mensagens}
                      voiceId={voiceId}
                      voiceProvider={voiceProvider}
                      tts={ttsForMestre}
                      entidadesComImagem={entidadesComImagem}
                      contextoImagemCena={contextoImagemCena}
                      onSceneImageGenerated={onSceneImageGenerated}
                      estiloImagem={estiloImagem}
                    />
                  );
                }
                return renderMensagem(group.mensagem, idx);
              })
            ) : (
              <div className="text-center py-12">
                <div className="game-glass p-10 rounded-2xl border border-purple-500/30 shadow-lg">
                  <div className="mb-4 flex justify-center">
                    <div className="w-20 h-20 rounded-3xl game-glass-subtle border border-purple-400/25 flex items-center justify-center shadow-lg">
                      <ScrollText size={38} className="text-purple-200 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-fantasy text-white mb-3 font-bold">
                    A aventura comecou!
                  </h3>
                  <p className="text-purple-200 text-lg">
                    O Mestre iniciara a narrativa em breve.
                  </p>
                </div>
              </div>
            )}

            {usuariosDigitando.length > 0 && (
              <div className="game-glass p-4 rounded-xl border border-purple-500/30 shadow-lg">
                <div className="flex items-center gap-3 text-purple-200 text-base">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>
                    {usuariosDigitando.join(', ')} {usuariosDigitando.length === 1 ? 'esta' : 'estao'} digitando...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {tts.currentTrackId != null && isGameAudioContext && (
        <div className="px-6 pb-2">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full game-glass-subtle border border-white/[0.08]">
              <button
                type="button"
                onClick={tts.previous}
                disabled={tts.queueIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Voltar para o trecho anterior"
                title="Voltar para o trecho anterior"
              >
                <SkipBack size={16} />
              </button>
              <button
                type="button"
                onClick={tts.togglePause}
                disabled={!tts.canTogglePlayback}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={tts.isPlaying ? 'Pausar narracao atual' : 'Continuar narracao atual'}
                title={tts.isPlaying ? 'Pausar narracao atual' : 'Continuar narracao atual'}
              >
                {!tts.canTogglePlayback ? <Loader2 size={16} className="animate-spin" /> : tts.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                onClick={tts.stop}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300/60 hover:text-red-200 transition-all flex-shrink-0"
                aria-label="Parar narracao"
                title="Parar narracao"
              >
                <Square size={16} />
              </button>
              <button
                type="button"
                onClick={tts.cyclePlaybackRate}
                className="px-2 py-1 rounded-lg hover:bg-cyan-500/20 text-[11px] font-mono text-cyan-300/60 hover:text-cyan-200 transition-all flex-shrink-0"
                title="Alterar velocidade"
                aria-label="Alterar velocidade"
              >
                {`${tts.playbackRate}x`}
              </button>
              <span
                className="text-xs text-purple-200/70 truncate flex-1 min-w-0"
                title={currentLabel}
              >
                {currentLabel}
              </span>
              {canShowQueue && (
                <button
                  type="button"
                  onClick={tts.toggleQueue}
                  className="p-1.5 rounded-lg hover:bg-cyan-500/15 text-cyan-200 hover:text-cyan-100 transition-all flex-shrink-0"
                  aria-label="Abrir fila de narracao"
                  title="Abrir fila de narracao"
                >
                  <ListMusic size={16} />
                </button>
              )}
              <span className="text-[11px] font-mono text-purple-300/60 flex-shrink-0">{formatTime(tts.currentTime)}</span>
              <input
                type="range"
                min={0}
                max={tts.duration || 0}
                step="0.1"
                value={Math.min(tts.currentTime || 0, tts.duration || 0)}
                onChange={(e) => tts.seekTo(Number(e.target.value))}
                className="tts-slider w-32 flex-shrink-0"
                disabled={!tts.duration || !tts.canTogglePlayback}
                aria-label="Avancar ou voltar narracao"
              />
              <span className="text-[11px] font-mono text-purple-300/60 flex-shrink-0">{formatTime(tts.duration)}</span>
              <button
                type="button"
                onClick={tts.next}
                disabled={!tts.queueItems?.length || tts.queueIndex >= (tts.queueItems.length - 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Avancar para o proximo trecho"
                title="Avancar para o proximo trecho"
              >
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <AudioQueuePopover
        isOpen={canShowQueue && tts.queueOpen}
        onClose={() => tts.setQueueOpen(false)}
        queueItems={(tts.queueItems ?? []) as Parameters<typeof AudioQueuePopover>[0]['queueItems']}
        title={(tts.currentPlaylist as { title?: string } | null | undefined)?.title || 'Fila de narracao'}
      />
    </div>
  );
};

export default ChatArea;
