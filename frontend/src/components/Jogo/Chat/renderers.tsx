import { Fragment, useState, useMemo, useEffect } from 'react';
import MarkdownRenderer from '../../MarkdownRenderer';
import { imageGenerationService } from '../../../services';
import ImageLightbox from '../../ImageLightbox';
import NarrationSegments, { buildNarrationSequenceItems, type NarrationTrackItem, type NarrationSegmentsTtsController } from '../../shared/NarrationSegments';
import { ImageIcon, Play, Pause } from 'lucide-react';
import { buildTtsItemKey } from '../../../utils/ttsKeys';

/**
 * Mensagem de chat — payload extremamente flexivel (vem do socket, do backend
 * legado e ate de fallback in-memory). Mantemos como `Record<string, unknown>`
 * com narrowing local em cada renderer.
 */
export type ChatMensagem = Record<string, unknown>;

interface MensagemSegmento {
  id?: string | number;
  text?: string;
  message?: string;
  mensagem?: string;
  speech_text?: string | null;
  speaker_label?: string;
  speakerLabel?: string;
  tipo?: string;
}

const asMsg = (m: ChatMensagem) => m as Record<string, unknown> & {
  id?: string | number;
  message?: string;
  mensagem?: string;
  speech_text?: string;
  voice_id?: string;
  voice_provider?: string;
  npc_nome?: string;
  speaker_label?: string;
  audio_cache_key?: string;
  audio_url?: string;
  audioUrl?: string;
  segmentos?: MensagemSegmento[];
};

const getConteudo = (msg: ChatMensagem): string => {
  const m = asMsg(msg);
  const text = m.message || m.mensagem || '';
  // Sanitize legacy [object Object] from old dice roll messages
  return typeof text === 'string' ? text.replace(/\[object Object\]/g, 'd20') : String(text);
};
const RE_SOLICITACAO_DADOS = /(\u{1F3B2}\s*)?[Rr]ole/iu;
const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

const buildFallbackNarrationItem = (
  mensagem: ChatMensagem,
  defaultVoiceId: string | null = null,
  defaultVoiceProvider: string = DEFAULT_TTS_PROVIDER,
): NarrationTrackItem | null => {
  const text = String(getConteudo(mensagem) || '').trim();
  const m = asMsg(mensagem);
  const voiceId = m.voice_id || defaultVoiceId || null;
  const provider = m.voice_provider || defaultVoiceProvider || DEFAULT_TTS_PROVIDER;

  if (!text || !voiceId) return null;

  return {
    trackId: buildTtsItemKey(
      m.id ?? '',
      null,
      voiceId,
      provider,
      null,
      m.speech_text || text,
    ),
    itemKey: buildTtsItemKey(
      m.id ?? '',
      null,
      voiceId,
      provider,
      null,
      m.speech_text || text,
    ),
    messageId: m.id != null ? String(m.id) : null,
    segmentId: null,
    text,
    speechText: m.speech_text || text,
    voiceId,
    provider,
    emotion: null,
    speakerLabel: m.npc_nome || m.speaker_label || 'Mestre',
    kind: m.npc_nome ? 'fala_npc' : 'narracao',
    tipo: m.npc_nome ? 'fala_npc' : 'narracao',
    hasPersistedAudio: Boolean(m.audio_cache_key || m.audio_url || m.audioUrl),
  };
};

const buildMessageSequenceItems = (
  mensagem: ChatMensagem,
  defaultVoiceId: string | null = null,
  defaultVoiceProvider: string = DEFAULT_TTS_PROVIDER,
): NarrationTrackItem[] => {
  const m = asMsg(mensagem);
  const segmentItems = buildNarrationSequenceItems(
    m.segmentos || [],
    m.id ?? '',
    m.voice_id || defaultVoiceId || null,
    m.voice_provider || defaultVoiceProvider || DEFAULT_TTS_PROVIDER,
  );

  if (segmentItems.length > 0) return segmentItems;

  const fallbackItem = buildFallbackNarrationItem(mensagem, defaultVoiceId, defaultVoiceProvider);
  return fallbackItem ? [fallbackItem] : [];
};

const buildSequenceKey = (prefix: string, items: NarrationTrackItem[] = []): string | null => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return `${prefix}:${items.map((item) => item.itemKey).join('|')}`;
};

const extractSegmentText = (segment: MensagemSegmento): string =>
  String(segment?.text || segment?.message || segment?.mensagem || '').trim();

const resolveSpeakerLabel = (segment: MensagemSegmento): string => (
  segment?.speaker_label
  || segment?.speakerLabel
  || (segment?.tipo === 'fala_npc' ? 'NPC' : 'Mestre')
);

const buildBalloonPromptText = (mensagem: ChatMensagem): string => {
  const m = asMsg(mensagem);
  const segmentos: MensagemSegmento[] = Array.isArray(m.segmentos) ? m.segmentos : [];
  const segmentTexts = segmentos
    .map((segment) => {
      const text = extractSegmentText(segment);
      if (!text) return null;
      return `${resolveSpeakerLabel(segment)}: ${text}`;
    })
    .filter(Boolean);

  if (segmentTexts.length > 0) {
    return segmentTexts.join('\n\n');
  }

  return String(getConteudo(mensagem) || '').trim();
};

interface TestePendenteShape {
  tipoDado?: string;
  teste?: string;
  dificuldade?: string | number;
}

interface MensagemPayload {
  testePendente?: TestePendenteShape;
  tipoDado?: string;
  teste?: string;
  dificuldade?: string | number;
  dice?: string;
  rolagemBruta?: number;
  resultado?: number | string;
  [key: string]: unknown;
}

const buildPendingTestSummary = (mensagem: ChatMensagem): string => {
  const payload = (mensagem as { payload?: MensagemPayload })?.payload || {};
  const testePendente = payload?.testePendente || {};
  const tipoDado = payload?.tipoDado || testePendente?.tipoDado || 'd20';
  const teste = payload?.teste || testePendente?.teste || 'Teste';
  const dificuldade = payload?.dificuldade || testePendente?.dificuldade || null;

  const parts = [`Teste pendente: role ${tipoDado}`];
  if (teste) parts.push(`para ${teste}`);
  if (dificuldade) parts.push(`(${dificuldade})`);
  return parts.join(' ');
};

const buildGroupPromptText = (mensagens: ChatMensagem[] = []): string => (
  (Array.isArray(mensagens) ? mensagens : [])
    .map((mensagem) => buildBalloonPromptText(mensagem))
    .filter(Boolean)
    .join('\n\n')
);

export interface EntidadeComImagem {
  tipo?: string;
  nome: string;
  descricao?: string;
  papel?: string;
  local?: string;
  categoria?: string;
  perigo?: string;
  motivacao?: string;
  segredo?: string;
  url?: string;
  imagem?: string;
}

const buildEntityPayload = (entidades: EntidadeComImagem[] = []) => entidades.map((e) => ({
  tipo: e.tipo,
  nome: e.nome,
  descricao: e.descricao || '',
  papel: e.papel || '',
  local: e.local || '',
  categoria: e.categoria || '',
  perigo: e.perigo || '',
  motivacao: e.motivacao || '',
  segredo: e.segredo || '',
}));

export const findMentionedEntities = (text: string, entidadesComImagem: EntidadeComImagem[] = []): EntidadeComImagem[] => {
  if (!entidadesComImagem?.length || !text) return [];
  const normalized = text.toLowerCase();
  return entidadesComImagem.filter((entidade) => normalized.includes(entidade.nome.toLowerCase()));
};

type Key = string | number;

interface DetalheBonus {
  valor: number;
  fonte: string;
}

export const renderDado = (mensagem: ChatMensagem, key: Key) => {
  const m = mensagem as Record<string, unknown> & { username?: string };
  const p = (m.payload as Record<string, unknown>) || {};
  const rawDice = (typeof m.dice === 'string' ? m.dice : null) || (typeof p.dice === 'string' ? p.dice : null) || 'd20';
  const dice = rawDice.includes('[object Object]') ? 'd20' : rawDice;
  const rolagemBruta = m.rolagemBruta ?? p.rolagemBruta ?? m.result ?? p.resultado ?? m.valor ?? '?';
  const modificador = (m.modificador ?? p.modificador ?? 0) as number;
  const bonusNivel = (m.bonusNivel ?? p.bonusNivel ?? 0) as number;
  const atributoNome = (m.atributoNome || p.atributoNome || 'Sorte') as string;
  const detalhes = (m.detalhesBonus || p.detalhesBonus || []) as DetalheBonus[];
  const total = m.total ?? p.total;
  const dc = (m.dc ?? p.dc) as number | undefined;
  const sucesso = (m.sucesso ?? p.sucesso) as boolean | undefined;
  const descricaoResultado = (m.descricaoResultado || p.descricaoResultado || null) as string | null;

  const modBase = (modificador || 0) + (bonusNivel || 0);
  const temModBase = modBase !== 0;
  const temDetalhes = detalhes.length > 0;
  const isDamageRoll = dc === 0 || descricaoResultado?.toLowerCase().includes('dano');
  return (
    <div key={key} className="max-w-[70%] mx-auto animate-fade-in my-2">
      <div className="game-glass-subtle px-5 py-3 rounded-full border border-amber-500/30">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl">{'\u{1F3B2}'}</span>
          <div className="text-center">
            <p className="text-amber-200/80 text-sm">
              <span className="font-semibold text-amber-100">{String(m.username ?? '')}</span> rolou {dice}
              {' — '}
              <span className="text-amber-300 font-bold text-base">
                {String(rolagemBruta)}
              </span>
              {temModBase && (
                <span className="text-amber-200/70">
                  {' '}{modBase > 0 ? '+' : ''}{modBase} ({atributoNome})
                </span>
              )}
              {temDetalhes && detalhes.map((d: DetalheBonus, i: number) => (
                <span key={i} className="text-cyan-300/80">
                  {' '}{d.valor > 0 ? '+' : ''}{d.valor} ({d.fonte})
                </span>
              ))}
              {(temModBase || temDetalhes) && (
                <span className="text-amber-100 font-bold"> = {String(total)}</span>
              )}
            </p>
            {descricaoResultado && (
              <p className={`text-xs font-semibold mt-0.5 ${sucesso ? 'text-green-400' : 'text-red-400'}`}>
                {descricaoResultado}{!isDamageRoll && dc != null ? ` (DC ${dc})` : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderRoleplay = (mensagem: ChatMensagem, key: Key) => (
  <div key={key} className="max-w-[80%] ml-auto animate-fade-in">
    <div className="game-glass-subtle p-4 rounded-xl border border-purple-500/20">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-sm">
          {'\u{1F4AC}'}
        </div>
        <div className="flex-1">
          <p className="text-purple-300 text-sm font-semibold mb-1">
            {String((mensagem as { username?: unknown }).username ?? '')} <span className="italic text-purple-400/60 text-xs">(roleplay)</span>
          </p>
          <p className="text-white/90 text-base italic leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const renderLoading = (mensagem: ChatMensagem, key: Key) => (
  <div key={key} className="max-w-[60%] mx-auto animate-fade-in my-2">
    <div className="game-glass-subtle px-4 py-2.5 rounded-full border border-purple-500/20">
      <div className="flex items-center justify-center gap-2.5">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
        </div>
        <p className="text-purple-300/80 text-sm font-medium">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderCombate = (mensagem: ChatMensagem, key: Key) => (
  <div key={key} className="max-w-[75%] mx-auto animate-fade-in my-2">
    <div className="game-glass-subtle p-4 rounded-xl border border-red-500/30">
      <div className="flex items-start gap-2.5">
        <span className="text-xl mt-0.5">{'\u{2694}\u{FE0F}'}</span>
        <div className="flex-1">
          <p className="text-red-300/80 font-semibold text-xs uppercase tracking-wide mb-1">
            Combate
            {Boolean((mensagem as { critico?: unknown }).critico) && <span className="text-yellow-300 ml-2 normal-case">Acerto Critico!</span>}
          </p>
          <p className="text-white/90 text-sm leading-relaxed">
            {getConteudo(mensagem)}
          </p>
          {((mensagem as { dano?: number }).dano ?? 0) > 0 && (
            <p className="text-orange-300 text-xs mt-1 font-semibold">
              -{(mensagem as { dano?: number }).dano} HP
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const renderTransicaoTurno = (mensagem: ChatMensagem, key: Key) => (
  <div key={key} className="max-w-[60%] mx-auto animate-fade-in my-3">
    <div className="game-glass-subtle px-4 py-2 rounded-full border border-cyan-500/20">
      <p className="text-cyan-300/80 text-xs text-center font-medium">
        {getConteudo(mensagem)}
      </p>
    </div>
  </div>
);

export const renderAguardandoDados = (mensagem: ChatMensagem, key: Key) => {
  const resumo = buildPendingTestSummary(mensagem);
  const payload = (mensagem as { payload?: { contexto?: string; testePendente?: { contexto?: string } } }).payload;
  const contexto = payload?.contexto || payload?.testePendente?.contexto || null;

  return (
    <div key={key} className="max-w-[70%] mx-auto animate-fade-in my-3">
      <div className="game-glass-subtle px-4 py-2.5 rounded-2xl border border-amber-500/20">
        <div className="flex items-center justify-center gap-2">
          <span className="text-base animate-pulse">{'\u{23F3}'}</span>
          <p className="text-amber-300/90 text-sm font-semibold">
            {resumo}
          </p>
        </div>
        {contexto && (
          <p className="mt-1 text-center text-xs text-amber-200/60">
            A rolagem resolve a acao em andamento.
          </p>
        )}
      </div>
    </div>
  );
};

export const renderAcaoMestre = (mensagem: ChatMensagem, key: Key) => {
  const conteudo = getConteudo(mensagem);
  const payload = ((mensagem as { payload?: { personagem?: string } }).payload || {}) as { personagem?: string };
  return (
    <div key={key} className="max-w-[70%] mx-auto animate-fade-in my-2">
      <div className="game-glass-subtle px-4 py-2.5 rounded-xl border border-emerald-500/20">
        <div className="flex items-start gap-2.5">
          <span className="text-base mt-0.5">{'\u2699\uFE0F'}</span>
          <div className="flex-1">
            <p className="text-emerald-300/70 text-xs font-semibold uppercase tracking-wide mb-0.5">
              Sistema
            </p>
            <p className="text-white/90 text-sm leading-relaxed">
              {conteudo}
            </p>
            {payload?.personagem && (
              <p className="text-emerald-200/60 text-xs mt-1">
                Alvo: {payload.personagem}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderEntreRodadas = (mensagem: ChatMensagem, key: Key) => {
  const m = mensagem as { titulo?: string; narrativa?: string };
  return (
  <div key={key} className="max-w-[80%] mx-auto animate-fade-in my-6">
    <div className="game-glass-subtle p-6 rounded-2xl border border-cyan-400/30">
      <div className="text-center mb-3">
        <span className="text-4xl">{'\u{1F31F}'}</span>
        <h3 className="text-xl font-fantasy font-bold text-cyan-300 mt-2">
          {m.titulo || 'Fim de Rodada'}
        </h3>
      </div>
      <p className="text-white/90 text-base leading-relaxed text-center">
        {getConteudo(mensagem) || m.narrativa}
      </p>
    </div>
  </div>
  );
};

export const renderMestre = (mensagem: ChatMensagem, key: Key) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);
  const destaque = (mensagem as { destaque?: boolean }).destaque;

  return (
    <div key={key} className="max-w-[88%] animate-fade-in">
      <div className={`game-glass p-4 rounded-xl border shadow-[0_0_20px_rgba(139,92,246,0.08)] border-l-4 ${
        temSolicitacaoDados || destaque
          ? 'border-amber-400/60 border-l-amber-400/60 bg-gradient-to-br from-amber-900/40 to-orange-900/30'
          : 'border-purple-400/40 border-l-purple-400/40 bg-gradient-to-br from-purple-900/20 to-pink-900/15'
      }`}>
        <div className="flex items-start space-x-3">
          <span className="text-xl mt-0.5">
            {temSolicitacaoDados ? '\u{1F3B2}' : '\u{1F3AD}'}
          </span>
          <div className="flex-1">
            <p className={`font-fantasy text-xs uppercase tracking-widest mb-2 ${
              temSolicitacaoDados ? 'text-amber-300/80' : 'text-purple-300/70'
            }`}>
              Mestre {temSolicitacaoDados && '\u{2014} Solicita Rolagem!'}
            </p>
            <MarkdownRenderer className="text-white/90 text-base leading-relaxed">
              {conteudo}
            </MarkdownRenderer>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MestreMessage - Componente React para mensagens do mestre com TTS
 * Recebe instancia compartilhada de useTTS via props (do ChatArea)
 */
interface MestreMessageTtsController extends NarrationSegmentsTtsController {
  currentSequenceKey?: string | null;
  loadingSequenceKey?: string | null;
  loadingTargetId?: string | number | null;
  isPlaying?: boolean;
  canTogglePlayback?: boolean;
  togglePause?: () => void | Promise<void>;
  playSequence?: (items: NarrationTrackItem[], options: { sequenceKey: string | null; messageId: string | number; contextLabel?: string }) => void | Promise<void>;
  lastError?: string | null;
  errorMessageId?: string | number | null;
  hasAudioForItem?: (itemKey: string) => boolean;
  toggleSequence?: (items: NarrationTrackItem[], options: { sequenceKey: string | null; messageId: string | number; contextLabel?: string }) => void | Promise<void>;
}

export interface ContextoImagemCena {
  temas?: string[];
  historiaNome?: string;
  historiaDescricao?: string;
  historiaPrologo?: string;
}

interface MestreMessageProps {
  mensagem: ChatMensagem;
  voiceId?: string | null;
  voiceProvider?: string;
  tts: MestreMessageTtsController;
  entidadesComImagem?: EntidadeComImagem[];
  contextoImagemCena?: ContextoImagemCena;
  onSceneImageGenerated?: (id: string | number, url: string) => void;
  estiloImagem?: string | null;
  grouped?: boolean;
  isFirst?: boolean;
  hideHeaderControls?: boolean;
}

export const MestreMessage = ({
  mensagem,
  voiceId,
  voiceProvider,
  tts,
  entidadesComImagem,
  contextoImagemCena,
  onSceneImageGenerated,
  estiloImagem,
  grouped = false,
  isFirst = false,
  hideHeaderControls = false,
}: MestreMessageProps) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);
  const m = asMsg(mensagem) as ReturnType<typeof asMsg> & {
    scene_image?: string | null;
    sceneImage?: string | null;
    imagem_cena?: string | null;
  };
  const effectiveVoiceId: string | null = m.voice_id || voiceId || null;
  const effectiveVoiceProvider: string = m.voice_provider || voiceProvider || DEFAULT_TTS_PROVIDER;
  const segmentItems = useMemo(
    () => buildNarrationSequenceItems(m.segmentos || [], m.id ?? '', effectiveVoiceId, effectiveVoiceProvider),
    [m.segmentos, m.id, effectiveVoiceId, effectiveVoiceProvider],
  );
  const messageSequenceItems = useMemo(
    () => buildMessageSequenceItems(mensagem, effectiveVoiceId, effectiveVoiceProvider),
    [mensagem, effectiveVoiceId, effectiveVoiceProvider],
  );
  const messageSequenceKey = useMemo(
    () => buildSequenceKey(`message:${m.id ?? ''}`, messageSequenceItems),
    [m.id, messageSequenceItems],
  );
  const balloonPromptText = useMemo(
    () => buildBalloonPromptText(mensagem),
    [mensagem],
  );
  const hasSegmentedNarration = segmentItems.length > 0;
  const isThisSequenceActive = Boolean(
    messageSequenceKey
    && tts.currentSequenceKey === messageSequenceKey
  );
  const isThisPlaying = isThisSequenceActive && tts.isPlaying;
  const isPreparingThisAudio = Boolean(
    messageSequenceKey
    && tts.loadingSequenceKey === messageSequenceKey
    && String(tts.loadingTargetId || '') === String(m.id ?? '')
    && !tts.canTogglePlayback
    && !isThisSequenceActive
  );
  const isWaitingNextAudio = Boolean(
    isThisSequenceActive
    && !tts.isPlaying
    && !tts.canTogglePlayback
  );
  const hasVoiceControls = messageSequenceItems.some((item) => item.voiceId);
  const hasCachedAudio = messageSequenceItems.some((item) => tts.hasAudioForItem?.(item.itemKey));
  const hasPersistedAudio = messageSequenceItems.some((item) => item.hasPersistedAudio);
  const hasAnyAudio = hasCachedAudio || hasPersistedAudio;

  const [sceneImage, setSceneImage] = useState<string | null>(
    m.scene_image || m.sceneImage || m.imagem_cena || null,
  );
  const [generatingScene, setGeneratingScene] = useState(false);
  const [sceneLightbox, setSceneLightbox] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<EntidadeComImagem | null>(null);

  useEffect(() => {
    const persistedSceneImage = m.scene_image || m.sceneImage || m.imagem_cena || null;
    setSceneImage(persistedSceneImage);
  }, [m.id, m.scene_image, m.sceneImage, m.imagem_cena]);

  const entidadesMencionadas = useMemo(
    () => findMentionedEntities(balloonPromptText, entidadesComImagem),
    [balloonPromptText, entidadesComImagem]
  );

  const handleBalloonImage = async () => {
    if (sceneImage) {
      setSceneLightbox(true);
      return;
    }

    if (generatingScene || !balloonPromptText) return;

    setGeneratingScene(true);
    try {
      const response = (await imageGenerationService.generate({
        entityType: 'cena',
        entityData: {
          narracao: balloonPromptText,
          estilo_imagem: estiloImagem,
          temas: contextoImagemCena?.temas || [],
          contexto_historia: [
            contextoImagemCena?.historiaNome,
            contextoImagemCena?.historiaDescricao,
            contextoImagemCena?.historiaPrologo,
          ].filter(Boolean).join(' | '),
          entidades: buildEntityPayload(entidadesMencionadas),
        },
      })) as { data?: { url?: string } } | null;
      const url = response?.data?.url;
      if (url && m.id != null) {
        setSceneImage(url);
        onSceneImageGenerated?.(m.id, url);
      }
    } catch (_) {
      // silent
    } finally {
      setGeneratingScene(false);
    }
  };

  const handleBalloonAudio = async () => {
    if (!hasVoiceControls) return;

    if (isThisSequenceActive) {
      await tts.togglePause?.();
      return;
    }

    await tts.playSequence?.(
      messageSequenceItems,
      {
        sequenceKey: messageSequenceKey || `message:${m.id ?? ''}`,
        messageId: m.id ?? '',
        contextLabel: 'Balao completo',
      },
    );
  };

  const innerContent = (
    <>
      {!hideHeaderControls && (
        <div className="flex items-center justify-between gap-3 mb-2">
          {(!grouped || isFirst) ? (
            <p className={`font-fantasy text-xs uppercase tracking-widest ${
              temSolicitacaoDados ? 'text-amber-300/80' : 'text-purple-300/70'
            }`}>
              Mestre {temSolicitacaoDados && '— Solicita Rolagem!'}
            </p>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBalloonImage}
              disabled={generatingScene || !balloonPromptText}
              className={`p-1.5 rounded-lg transition-all ${
                generatingScene
                  ? 'opacity-50 cursor-not-allowed text-purple-200'
                  : sceneImage
                    ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                    : 'hover:bg-cyan-500/15 text-cyan-300 hover:text-cyan-100'
              }`}
              title={sceneImage ? 'Abrir imagem do balao' : 'Gerar imagem do balao'}
              aria-label={sceneImage ? 'Abrir imagem do balao' : 'Gerar imagem do balao'}
            >
              {generatingScene ? (
                <span className="inline-block w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              ) : <ImageIcon size={16} />}
            </button>
            {hasVoiceControls && (
                <button
                  type="button"
                  onClick={handleBalloonAudio}
                  disabled={isPreparingThisAudio || isWaitingNextAudio}
                className={`p-1.5 rounded-lg transition-all ${
                  isPreparingThisAudio
                    ? 'opacity-50 cursor-not-allowed text-purple-200'
                    : hasAnyAudio
                      ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                      : 'hover:bg-amber-500/15 text-amber-300 hover:text-amber-100'
                }`}
                title={
                  isPreparingThisAudio || isWaitingNextAudio
                    ? 'Preparando audio do balao'
                    : isThisPlaying
                    ? 'Pausar audio do balao'
                    : hasAnyAudio
                      ? 'Ouvir audio do balao'
                      : 'Gerar e ouvir audio do balao'
                }
                aria-label={
                  isPreparingThisAudio || isWaitingNextAudio
                    ? 'Preparando audio do balao'
                    : isThisPlaying
                    ? 'Pausar audio do balao'
                    : hasAnyAudio
                      ? 'Ouvir audio do balao'
                      : 'Gerar e ouvir audio do balao'
                }
              >
                {isPreparingThisAudio || isWaitingNextAudio ? (
                  <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                ) : isThisPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            )}
          </div>
        </div>
      )}
      {!hideHeaderControls && tts.lastError && tts.errorMessageId === m.id && (
        <p className="text-red-400 text-xs mb-2 text-right">{tts.lastError}</p>
      )}
      {hasSegmentedNarration ? (
        <NarrationSegments
          segments={m.segmentos || []}
          messageId={m.id ?? ''}
          tts={tts}
          defaultVoiceId={effectiveVoiceId}
          defaultVoiceProvider={effectiveVoiceProvider}
          variant="game"
        />
      ) : (
        <MarkdownRenderer className="text-white/90 text-base leading-relaxed">
          {conteudo}
        </MarkdownRenderer>
      )}
      {entidadesMencionadas.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {entidadesMencionadas.map((e, i) => (
            <div key={i} className="relative group/entity">
              <img
                src={e.imagem}
                alt={e.nome}
                className="h-24 w-24 object-cover rounded-lg border border-purple-500/30 cursor-pointer hover:border-purple-400/60 transition-all select-none caret-transparent"
                draggable={false}
                onClick={() => setActiveLightbox(e)}
              />
              <span className="absolute bottom-0 left-0 right-0 text-xs text-center bg-black/60 text-white rounded-b-lg px-1 py-0.5 truncate">
                {e.nome}
              </span>
            </div>
          ))}
          <ImageLightbox src={activeLightbox?.imagem ?? ''} alt={activeLightbox?.nome ?? ''} isOpen={!!activeLightbox} onClose={() => setActiveLightbox(null)} />
        </div>
      )}
      {!hideHeaderControls && sceneImage && (
        <div className="mt-3">
          <img
            src={sceneImage}
            alt="Ilustracao do balao"
            className="w-full max-h-64 object-cover rounded-lg border border-purple-500/30 cursor-pointer select-none caret-transparent"
            draggable={false}
            onClick={() => setSceneLightbox(true)}
          />
          <ImageLightbox src={sceneImage} alt="Ilustracao do balao" isOpen={sceneLightbox} onClose={() => setSceneLightbox(false)} />
        </div>
      )}
    </>
  );

  if (grouped) {
    return <div>{innerContent}</div>;
  }

  return (
    <div className="max-w-[88%] animate-fade-in">
      <div className={`game-glass p-4 rounded-xl border shadow-[0_0_20px_rgba(139,92,246,0.08)] border-l-4 ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/60 border-l-amber-400/60 bg-gradient-to-br from-amber-900/40 to-orange-900/30'
          : 'border-purple-400/40 border-l-purple-400/40 bg-gradient-to-br from-purple-900/20 to-pink-900/15'
      }`}>
        <div className="flex items-start space-x-3">
          <span className="text-xl mt-0.5">
            {temSolicitacaoDados ? '\u{1F3B2}' : '\u{1F3AD}'}
          </span>
          <div className="flex-1">
            {innerContent}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MestreMessageGroup - Agrupa 2+ mensagens consecutivas do mestre em um unico card
 */
interface MestreMessageGroupProps {
  mensagens: ChatMensagem[];
  voiceId?: string | null;
  voiceProvider?: string;
  tts: MestreMessageTtsController;
  entidadesComImagem?: EntidadeComImagem[];
  contextoImagemCena?: ContextoImagemCena;
  onSceneImageGenerated?: (id: string | number, url: string) => void;
  estiloImagem?: string | null;
}

export const MestreMessageGroup = ({
  mensagens,
  voiceId,
  voiceProvider,
  tts,
  entidadesComImagem,
  contextoImagemCena,
  onSceneImageGenerated,
  estiloImagem,
}: MestreMessageGroupProps) => {
  const groupSequenceItems = useMemo(
    () => (Array.isArray(mensagens) ? mensagens : []).flatMap((mensagem) => (
      buildMessageSequenceItems(mensagem, voiceId, voiceProvider)
    )),
    [mensagens, voiceId, voiceProvider]
  );
  const groupSequenceKey = useMemo(
    () => buildSequenceKey('group', groupSequenceItems),
    [groupSequenceItems]
  );
  const groupOwnerId = useMemo(
    () => (groupSequenceKey ? `group:${groupSequenceKey}` : null),
    [groupSequenceKey]
  );
  const hasVoiceControls = groupSequenceItems.some((item) => item.voiceId);
  const hasCachedAudio = groupSequenceItems.some((item) => tts.hasAudioForItem?.(item.itemKey));
  const hasPersistedAudio = groupSequenceItems.some((item) => item.hasPersistedAudio);
  const hasAnyAudio = hasCachedAudio || hasPersistedAudio;
  const isPreparingThisAudio = Boolean(
    groupSequenceKey
    && tts.loadingSequenceKey === groupSequenceKey
    && String(tts.loadingTargetId || '') === String(groupOwnerId || '')
    && !tts.canTogglePlayback
    && !(groupSequenceKey && tts.currentSequenceKey === groupSequenceKey)
  );
  const isThisPlaying = Boolean(
    groupSequenceKey
    && tts.currentSequenceKey === groupSequenceKey
    && tts.isPlaying
  );
  const isWaitingNextAudio = Boolean(
    groupSequenceKey
    && tts.currentSequenceKey === groupSequenceKey
    && !tts.isPlaying
    && !tts.canTogglePlayback
  );
  const groupPromptText = useMemo(
    () => buildGroupPromptText(mensagens),
    [mensagens]
  );
  const groupEntityMentions = useMemo(
    () => findMentionedEntities(groupPromptText, entidadesComImagem),
    [groupPromptText, entidadesComImagem]
  );
  const [sceneLightbox, setSceneLightbox] = useState(false);
  const [groupSceneImage, setGroupSceneImage] = useState<string | null>(
    () => (Array.isArray(mensagens) ? mensagens : [])
      .map((mensagem) => {
        const mm = mensagem as Record<string, unknown>;
        return (mm.scene_image as string | null) || (mm.sceneImage as string | null) || (mm.imagem_cena as string | null) || null;
      })
      .find(Boolean) || null,
  );
  const [generatingScene, setGeneratingScene] = useState(false);

  useEffect(() => {
    const persistedSceneImage = (Array.isArray(mensagens) ? mensagens : [])
      .map((mensagem) => {
        const mm = mensagem as Record<string, unknown>;
        return (mm.scene_image as string | null) || (mm.sceneImage as string | null) || (mm.imagem_cena as string | null) || null;
      })
      .find(Boolean) || null;
    setGroupSceneImage(persistedSceneImage);
  }, [mensagens]);

  const handleGroupImage = async () => {
    if (groupSceneImage) {
      setSceneLightbox(true);
      return;
    }

    if (generatingScene || !groupPromptText || !mensagens?.length) return;

    setGeneratingScene(true);
    try {
      const response = (await imageGenerationService.generate({
        entityType: 'cena',
        entityData: {
          narracao: groupPromptText,
          estilo_imagem: estiloImagem,
          temas: contextoImagemCena?.temas || [],
          contexto_historia: [
            contextoImagemCena?.historiaNome,
            contextoImagemCena?.historiaDescricao,
            contextoImagemCena?.historiaPrologo,
          ].filter(Boolean).join(' | '),
          entidades: buildEntityPayload(groupEntityMentions),
        },
      })) as { data?: { url?: string } } | null;
      const url = response?.data?.url;
      const firstId = (mensagens[0] as { id?: string | number } | undefined)?.id;
      if (url && firstId != null) {
        setGroupSceneImage(url);
        onSceneImageGenerated?.(firstId, url);
      }
    } catch {
      // silent
    } finally {
      setGeneratingScene(false);
    }
  };

  const handleGroupAudio = async () => {
    if (!groupOwnerId) return;

    if (groupSequenceKey && tts.currentSequenceKey === groupSequenceKey) {
      await tts.togglePause?.();
      return;
    }

    await tts.playSequence?.(groupSequenceItems, {
      sequenceKey: groupSequenceKey || groupOwnerId,
      messageId: groupOwnerId,
      contextLabel: 'Grupo de balaos',
    });
  };

  return (
    <div className="max-w-[88%] animate-fade-in">
      <div className="game-glass p-4 rounded-xl border shadow-[0_0_20px_rgba(139,92,246,0.08)] border-l-4 border-purple-400/40 border-l-purple-400/40 bg-gradient-to-br from-purple-900/20 to-pink-900/15">
        <div className="flex items-start space-x-3">
          <span className="text-xl mt-0.5">{'\u{1F3AD}'}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-fantasy text-xs uppercase tracking-widest text-purple-300/70">
                Mestre
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleGroupImage}
                  disabled={generatingScene || !groupPromptText}
                  className={`p-1.5 rounded-lg transition-all ${
                    generatingScene
                      ? 'opacity-50 cursor-not-allowed text-purple-200'
                      : groupSceneImage
                        ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                        : 'hover:bg-cyan-500/15 text-cyan-300 hover:text-cyan-100'
                  }`}
                  title={groupSceneImage ? 'Abrir imagem do balao' : 'Gerar imagem do balao'}
                  aria-label={groupSceneImage ? 'Abrir imagem do balao' : 'Gerar imagem do balao'}
                >
                  {generatingScene ? (
                    <span className="inline-block w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                  ) : <ImageIcon size={16} />}
                </button>
                {hasVoiceControls && (
                  <button
                    type="button"
                    onClick={handleGroupAudio}
                    disabled={isPreparingThisAudio || isWaitingNextAudio}
                    className={`p-1.5 rounded-lg transition-all ${
                      isPreparingThisAudio
                        ? 'opacity-50 cursor-not-allowed text-purple-200'
                        : hasAnyAudio
                          ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                          : 'hover:bg-amber-500/15 text-amber-300 hover:text-amber-100'
                    }`}
                    title={
                      isPreparingThisAudio || isWaitingNextAudio
                        ? 'Preparando audio do balao'
                        : isThisPlaying
                        ? 'Pausar audio do balao'
                        : hasAnyAudio
                          ? 'Ouvir audio do balao'
                          : 'Gerar e ouvir audio do balao'
                    }
                    aria-label={
                      isPreparingThisAudio || isWaitingNextAudio
                        ? 'Preparando audio do balao'
                        : isThisPlaying
                        ? 'Pausar audio do balao'
                        : hasAnyAudio
                          ? 'Ouvir audio do balao'
                          : 'Gerar e ouvir audio do balao'
                    }
                  >
                    {isPreparingThisAudio || isWaitingNextAudio ? (
                      <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    ) : isThisPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
              </div>
            </div>
            {tts.lastError && tts.errorMessageId === groupOwnerId && (
              <p className="text-red-400 text-xs mb-2 text-right">{tts.lastError}</p>
            )}
            {mensagens.map((msg, i) => (
              <Fragment key={(msg as { id?: string | number }).id ?? i}>
                {i > 0 && <hr className="border-purple-500/20 my-3" />}
                <MestreMessage
                  mensagem={msg}
                  grouped
                  isFirst={i === 0}
                  hideHeaderControls
                  voiceId={voiceId}
                  voiceProvider={voiceProvider}
                  tts={tts}
                  entidadesComImagem={entidadesComImagem}
                  contextoImagemCena={contextoImagemCena}
                  onSceneImageGenerated={onSceneImageGenerated}
                  estiloImagem={estiloImagem}
                />
              </Fragment>
            ))}
            {groupSceneImage && (
              <div className="mt-3">
                <img
                  src={groupSceneImage}
                  alt="Ilustracao do balao"
                  className="w-full max-h-64 object-cover rounded-lg border border-purple-500/30 cursor-pointer select-none caret-transparent"
                  draggable={false}
                  onClick={() => setSceneLightbox(true)}
                />
                <ImageLightbox src={groupSceneImage} alt="Ilustracao do balao" isOpen={sceneLightbox} onClose={() => setSceneLightbox(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * JogadorMessage — Balão do jogador com suporte a TTS.
 * Se a mensagem tiver voice_id, exibe botão de play.
 */
interface JogadorMessageProps {
  mensagem: ChatMensagem;
  tts: (MestreMessageTtsController & { isLoading?: boolean; isGenerating?: boolean }) | null;
}

export const JogadorMessage = ({ mensagem, tts }: JogadorMessageProps) => {
  const m = mensagem as ChatMensagem & {
    voice_id?: string;
    voice_provider?: string;
    speech_text?: string;
    id?: string | number;
    username?: string;
    personagem?: string;
  };
  const voiceId = m.voice_id;
  const voiceProvider = m.voice_provider || 'opensource';
  const messageText = m.speech_text || getConteudo(mensagem);
  const hasVoice = Boolean(voiceId && tts && messageText);

  const messageSequenceKey = `jogador:${m.id ?? ''}`;
  const isThisActive = tts?.currentSequenceKey === messageSequenceKey;
  const isThisPlaying = isThisActive && tts?.isPlaying;
  const isThisLoading = isThisActive && (tts?.isLoading || tts?.isGenerating);

  const handlePlay = async () => {
    if (!hasVoice || !tts) return;
    if (isThisActive) { await tts.togglePause?.(); return; }

    const items: NarrationTrackItem[] = [{
      trackId: buildTtsItemKey(m.id ?? '', null, voiceId ?? null, voiceProvider, null, messageText),
      itemKey: buildTtsItemKey(m.id ?? '', null, voiceId ?? null, voiceProvider, null, messageText),
      messageId: m.id != null ? String(m.id) : null,
      segmentId: null,
      text: messageText,
      speechText: messageText,
      voiceId: voiceId ?? null,
      provider: voiceProvider,
      emotion: null,
      speakerLabel: m.username || 'Jogador',
      kind: 'fala_jogador',
      tipo: 'fala_jogador',
      hasPersistedAudio: false,
    }];

    await tts.playSequence?.(items, {
      sequenceKey: messageSequenceKey,
      messageId: m.id ?? '',
      contextLabel: `Fala de ${m.username || 'Jogador'}`,
    });
  };

  return (
    <div className="max-w-[80%] ml-auto animate-fade-in">
      <div className="game-glass p-4 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.08)]">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-sm font-bold">
            {m.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-cyan-300 font-semibold text-sm">
                {m.username}
                {m.personagem && (
                  <span className="text-cyan-400/70 text-xs ml-1.5">
                    {m.personagem}
                  </span>
                )}
              </p>
              {hasVoice && (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="p-1 rounded-full text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                  title={isThisPlaying ? 'Pausar' : 'Ouvir'}
                  aria-label={isThisPlaying ? 'Pausar audio' : 'Ouvir mensagem'}
                >
                  {isThisLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-cyan-400/50 border-t-cyan-300 rounded-full animate-spin" />
                  ) : isThisPlaying ? (
                    <Pause size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                </button>
              )}
            </div>
            <p className="text-white text-base leading-relaxed">
              {getConteudo(mensagem)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Fallback renderer sem TTS (para MESSAGE_RENDERERS registry). */
export const renderJogador = (mensagem: ChatMensagem, key: Key) => (
  <JogadorMessage key={key} mensagem={mensagem} tts={null} />
);

export const renderMestreStreaming = (mensagem: ChatMensagem, key: Key) => {
  const conteudo = getConteudo(mensagem);

  return (
    <div key={key} className="max-w-[88%] animate-fade-in">
      <div className="game-glass p-4 rounded-xl border shadow-[0_0_20px_rgba(139,92,246,0.08)] border-l-4 border-purple-400/40 border-l-purple-400/40 bg-gradient-to-br from-purple-900/20 to-pink-900/15">
        <div className="flex items-start space-x-3">
          <span className="text-xl mt-0.5">{'\u{1F3AD}'}</span>
          <div className="flex-1">
            <p className="font-fantasy text-xs uppercase tracking-widest mb-2 text-purple-300/70">
              Mestre
            </p>
            {conteudo ? (
              <span>
                <MarkdownRenderer className="text-white text-lg leading-relaxed inline">
                  {conteudo}
                </MarkdownRenderer>
                <span className="inline-block w-0.5 h-5 bg-purple-300 animate-pulse ml-0.5 align-text-bottom" />
              </span>
            ) : (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderCombatMonster = (mensagem: ChatMensagem, key: Key) => {
  // Simple markdown: **bold** → <strong>
  const text = getConteudo(mensagem)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-red-300">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-red-400/70">$1</em>');
  return (
    <div key={key} className="max-w-[85%] mx-auto animate-fade-in my-1.5">
      <div className="game-glass-subtle px-3 py-2 rounded-xl border border-red-500/25 bg-red-950/20">
        <div className="flex items-start gap-2">
          <span className="text-base mt-0.5">{'\u{1F479}'}</span>
          <div className="flex-1">
            <p className="text-sm text-red-200/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Registry: tipo -> renderer (com aliases)
 */
export const MESSAGE_RENDERERS = {
  dado: renderDado,
  dados: renderDado,
  dice_roll: renderDado,
  resultado_dado_inicial: renderDado,
  resultado_teste: renderDado,
  roleplay: renderRoleplay,
  loading: renderLoading,
  combate: renderCombate,
  combat_monster: renderCombatMonster,
  sistema: renderTransicaoTurno,
  ordem_definida: renderTransicaoTurno,
  transicao_turno: renderTransicaoTurno,
  aguardando_dados: renderAguardandoDados,
  solicitacao_dados: renderAguardandoDados,
  acao_mestre: renderAcaoMestre,
  entre_rodadas: renderEntreRodadas,
  rodada_finalizada: renderEntreRodadas,
  mestre: renderMestre,
  mestre_streaming: renderMestreStreaming,
  jogador: renderJogador,
  player: renderJogador,
};
