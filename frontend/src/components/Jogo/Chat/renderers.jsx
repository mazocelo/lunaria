import React, { useState, useMemo, useEffect } from 'react';
import MarkdownRenderer from '../../MarkdownRenderer';
import { imageGenerationService } from '../../../services';
import ImageLightbox from '../../ImageLightbox.jsx';
import NarrationSegments, { buildNarrationSequenceItems } from '../../shared/NarrationSegments.jsx';
import { ImageIcon, Play, Pause } from 'lucide-react';

const getConteudo = (msg) => msg.message || msg.mensagem;
const RE_SOLICITACAO_DADOS = /(\u{1F3B2}\s*)?[Rr]ole/iu;
const DEFAULT_TTS_PROVIDER = import.meta.env.VITE_DEFAULT_TTS_PROVIDER || 'elevenlabs';

const buildFallbackNarrationItem = (mensagem, defaultVoiceId = null, defaultVoiceProvider = DEFAULT_TTS_PROVIDER) => {
  const text = String(getConteudo(mensagem) || '').trim();
  const voiceId = mensagem?.voice_id || defaultVoiceId || null;
  const provider = mensagem?.voice_provider || defaultVoiceProvider || DEFAULT_TTS_PROVIDER;

  if (!text || !voiceId) return null;

  return {
    itemKey: String(mensagem.id),
    messageId: mensagem.id,
    segmentId: null,
    text,
    voiceId,
    provider,
    emotion: null,
    speakerLabel: mensagem?.npc_nome || mensagem?.speaker_label || 'Mestre',
    tipo: mensagem?.npc_nome ? 'fala_npc' : 'narracao',
    hasPersistedAudio: Boolean(mensagem?.audio_cache_key || mensagem?.audio_url || mensagem?.audioUrl)
  };
};

const buildMessageSequenceItems = (mensagem, defaultVoiceId = null, defaultVoiceProvider = DEFAULT_TTS_PROVIDER) => {
  const segmentItems = buildNarrationSequenceItems(
    mensagem?.segmentos || [],
    mensagem?.id,
    mensagem?.voice_id || defaultVoiceId || null,
    mensagem?.voice_provider || defaultVoiceProvider || DEFAULT_TTS_PROVIDER
  );

  if (segmentItems.length > 0) return segmentItems;

  const fallbackItem = buildFallbackNarrationItem(
    mensagem,
    defaultVoiceId,
    defaultVoiceProvider
  );

  return fallbackItem ? [fallbackItem] : [];
};

const buildSequenceKey = (prefix, items = []) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return `${prefix}:${items.map((item) => item.itemKey).join('|')}`;
};

const extractSegmentText = (segment) => String(segment?.text || segment?.message || segment?.mensagem || '').trim();

const resolveSpeakerLabel = (segment) => (
  segment?.speaker_label
  || segment?.speakerLabel
  || (segment?.tipo === 'fala_npc' ? 'NPC' : 'Mestre')
);

const buildBalloonPromptText = (mensagem) => {
  const segmentos = Array.isArray(mensagem?.segmentos) ? mensagem.segmentos : [];
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

const buildGroupPromptText = (mensagens = []) => (
  (Array.isArray(mensagens) ? mensagens : [])
    .map((mensagem) => buildBalloonPromptText(mensagem))
    .filter(Boolean)
    .join('\n\n')
);

const buildEntityPayload = (entidades = []) => entidades.map((e) => ({
  tipo: e.tipo,
  nome: e.nome,
  descricao: e.descricao || '',
  papel: e.papel || '',
  local: e.local || '',
  categoria: e.categoria || '',
  perigo: e.perigo || '',
  motivacao: e.motivacao || '',
  segredo: e.segredo || ''
}));

const findMentionedEntities = (text, entidadesComImagem = []) => {
  if (!entidadesComImagem?.length || !text) return [];
  const normalized = text.toLowerCase();
  return entidadesComImagem.filter((entidade) => normalized.includes(entidade.nome.toLowerCase()));
};

export const renderDado = (mensagem, key) => {
  const modBase = (mensagem.modificador || 0) + (mensagem.bonusNivel || 0);
  const temModBase = modBase !== 0;
  const detalhes = mensagem.detalhesBonus || [];
  const temDetalhes = detalhes.length > 0;
  return (
    <div key={key} className="max-w-[70%] mx-auto animate-fade-in my-2">
      <div className="game-glass-subtle px-5 py-3 rounded-full border border-amber-500/30">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl">{'\u{1F3B2}'}</span>
          <div className="text-center">
            <p className="text-amber-200/80 text-sm">
              <span className="font-semibold text-amber-100">{mensagem.username}</span> rolou {mensagem.dice || 'd20'}
              {' — '}
              <span className="text-amber-300 font-bold text-base">
                {mensagem.rolagemBruta || mensagem.result || mensagem.valor || '?'}
              </span>
              {temModBase && (
                <span className="text-amber-200/70">
                  {' '}{modBase > 0 ? '+' : ''}{modBase} ({mensagem.atributoNome || 'Sorte'})
                </span>
              )}
              {temDetalhes && detalhes.map((d, i) => (
                <span key={i} className="text-cyan-300/80">
                  {' '}{d.valor > 0 ? '+' : ''}{d.valor} ({d.fonte})
                </span>
              ))}
              {(temModBase || temDetalhes) && (
                <span className="text-amber-100 font-bold"> = {mensagem.total}</span>
              )}
            </p>
            {mensagem.descricaoResultado && (
              <p className={`text-xs font-semibold mt-0.5 ${mensagem.sucesso ? 'text-green-400' : 'text-red-400'}`}>
                {mensagem.descricaoResultado} (DC {mensagem.dc})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderRoleplay = (mensagem, key) => (
  <div key={key} className="max-w-[80%] ml-auto animate-fade-in">
    <div className="game-glass-subtle p-4 rounded-xl border border-purple-500/20">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-sm">
          {'\u{1F4AC}'}
        </div>
        <div className="flex-1">
          <p className="text-purple-300 text-sm font-semibold mb-1">
            {mensagem.username} <span className="italic text-purple-400/60 text-xs">(roleplay)</span>
          </p>
          <p className="text-white/90 text-base italic leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const renderLoading = (mensagem, key) => (
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

export const renderCombate = (mensagem, key) => (
  <div key={key} className="max-w-[75%] mx-auto animate-fade-in my-2">
    <div className="game-glass-subtle p-4 rounded-xl border border-red-500/30">
      <div className="flex items-start gap-2.5">
        <span className="text-xl mt-0.5">{'\u{2694}\u{FE0F}'}</span>
        <div className="flex-1">
          <p className="text-red-300/80 font-semibold text-xs uppercase tracking-wide mb-1">
            Combate
            {mensagem.critico && <span className="text-yellow-300 ml-2 normal-case">Acerto Critico!</span>}
          </p>
          <p className="text-white/90 text-sm leading-relaxed">
            {getConteudo(mensagem)}
          </p>
          {mensagem.dano > 0 && (
            <p className="text-orange-300 text-xs mt-1 font-semibold">
              -{mensagem.dano} HP
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const renderTransicaoTurno = (mensagem, key) => (
  <div key={key} className="max-w-[60%] mx-auto animate-fade-in my-3">
    <div className="game-glass-subtle px-4 py-2 rounded-full border border-cyan-500/20">
      <p className="text-cyan-300/80 text-xs text-center font-medium">
        {getConteudo(mensagem)}
      </p>
    </div>
  </div>
);

export const renderAguardandoDados = (mensagem, key) => (
  <div key={key} className="max-w-[70%] mx-auto animate-fade-in my-3">
    <div className="game-glass-subtle px-4 py-2.5 rounded-full border border-amber-500/20">
      <div className="flex items-center justify-center gap-2">
        <span className="text-base animate-pulse">{'\u{23F3}'}</span>
        <p className="text-amber-300/80 text-sm font-medium">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderAcaoMestre = (mensagem, key) => {
  const conteudo = getConteudo(mensagem);
  const payload = mensagem.payload || {};
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

export const renderEntreRodadas = (mensagem, key) => (
  <div key={key} className="max-w-[80%] mx-auto animate-fade-in my-6">
    <div className="game-glass-subtle p-6 rounded-2xl border border-cyan-400/30">
      <div className="text-center mb-3">
        <span className="text-4xl">{'\u{1F31F}'}</span>
        <h3 className="text-xl font-fantasy font-bold text-cyan-300 mt-2">
          {mensagem.titulo || 'Fim de Rodada'}
        </h3>
      </div>
      <p className="text-white/90 text-base leading-relaxed text-center">
        {getConteudo(mensagem) || mensagem.narrativa}
      </p>
    </div>
  </div>
);

export const renderMestre = (mensagem, key) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);

  return (
    <div key={key} className="max-w-[88%] animate-fade-in">
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
export const MestreMessage = ({ mensagem, voiceId, voiceProvider, tts, entidadesComImagem, contextoImagemCena, onSceneImageGenerated, estiloImagem, grouped = false, isFirst = false, hideHeaderControls = false }) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);
  const effectiveVoiceId = mensagem.voice_id || voiceId;
  const effectiveVoiceProvider = mensagem.voice_provider || voiceProvider;
  const segmentItems = useMemo(
    () => buildNarrationSequenceItems(mensagem.segmentos || [], mensagem.id, effectiveVoiceId, effectiveVoiceProvider),
    [mensagem.segmentos, mensagem.id, effectiveVoiceId, effectiveVoiceProvider]
  );
  const messageSequenceItems = useMemo(
    () => buildMessageSequenceItems(mensagem, effectiveVoiceId, effectiveVoiceProvider),
    [mensagem, effectiveVoiceId, effectiveVoiceProvider]
  );
  const messageSequenceKey = useMemo(
    () => buildSequenceKey(`message:${mensagem.id}`, messageSequenceItems),
    [mensagem.id, messageSequenceItems]
  );
  const balloonPromptText = useMemo(
    () => buildBalloonPromptText(mensagem),
    [mensagem]
  );
  const hasSegmentedNarration = segmentItems.length > 0;
  const isThisSequenceActive = Boolean(
    messageSequenceKey
    && tts.currentSequenceKey === messageSequenceKey
  );
  const isThisPlaying = isThisSequenceActive && tts.isPlaying;
  const isPreparingThisAudio = Boolean(tts.isLoading && String(tts.currentMessageId || '') === String(mensagem.id));
  const hasVoiceControls = messageSequenceItems.some((item) => item.voiceId);
  const hasCachedAudio = messageSequenceItems.some((item) => tts.hasAudioForItem?.(item.itemKey));
  const hasPersistedAudio = messageSequenceItems.some((item) => item.hasPersistedAudio);
  const hasAnyAudio = hasCachedAudio || hasPersistedAudio;

  const [sceneImage, setSceneImage] = useState(
    mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null
  );
  const [generatingScene, setGeneratingScene] = useState(false);
  const [sceneLightbox, setSceneLightbox] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);

  useEffect(() => {
    const persistedSceneImage = mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null;
    setSceneImage(persistedSceneImage);
  }, [mensagem.id, mensagem.scene_image, mensagem.sceneImage, mensagem.imagem_cena]);

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
      const response = await imageGenerationService.generate({
        entityType: 'cena',
        entityData: {
          narracao: balloonPromptText,
          estilo_imagem: estiloImagem,
          temas: contextoImagemCena?.temas || [],
          contexto_historia: [
            contextoImagemCena?.historiaNome,
            contextoImagemCena?.historiaDescricao,
            contextoImagemCena?.historiaPrologo
          ].filter(Boolean).join(' | '),
          entidades: buildEntityPayload(entidadesMencionadas)
        }
      });
      const url = response.data?.url;
      if (url) {
        setSceneImage(url);
        onSceneImageGenerated?.(mensagem.id, url);
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
      tts.togglePause();
      return;
    }

    await tts.playSequence(
      messageSequenceItems,
      mensagem.id,
      {
        allowGenerate: true,
        sequenceKey: messageSequenceKey || `message:${mensagem.id}`
      }
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
                disabled={isPreparingThisAudio}
                className={`p-1.5 rounded-lg transition-all ${
                  isPreparingThisAudio
                    ? 'opacity-50 cursor-not-allowed text-purple-200'
                    : hasAnyAudio
                      ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                      : 'hover:bg-amber-500/15 text-amber-300 hover:text-amber-100'
                }`}
                title={
                  isThisPlaying
                    ? 'Pausar audio do balao'
                    : hasAnyAudio
                      ? 'Ouvir audio do balao'
                      : 'Gerar e ouvir audio do balao'
                }
                aria-label={
                  isThisPlaying
                    ? 'Pausar audio do balao'
                    : hasAnyAudio
                      ? 'Ouvir audio do balao'
                      : 'Gerar e ouvir audio do balao'
                }
              >
                {isPreparingThisAudio ? (
                  <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                ) : isThisPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            )}
          </div>
        </div>
      )}
      {!hideHeaderControls && tts.lastError && tts.errorMessageId === mensagem.id && (
        <p className="text-red-400 text-xs mb-2 text-right">{tts.lastError}</p>
      )}
      {hasSegmentedNarration ? (
        <NarrationSegments
          segments={mensagem.segmentos || []}
          messageId={mensagem.id}
          tts={tts}
          defaultVoiceId={effectiveVoiceId}
          defaultVoiceProvider={effectiveVoiceProvider}
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
                onClick={() => setActiveLightbox(e.imagem)}
              />
              <span className="absolute bottom-0 left-0 right-0 text-xs text-center bg-black/60 text-white rounded-b-lg px-1 py-0.5 truncate">
                {e.nome}
              </span>
            </div>
          ))}
          <ImageLightbox src={activeLightbox} alt="" isOpen={!!activeLightbox} onClose={() => setActiveLightbox(null)} />
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
export const MestreMessageGroup = ({ mensagens, voiceId, voiceProvider, tts, entidadesComImagem, contextoImagemCena, onSceneImageGenerated, estiloImagem }) => {
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
  const isPreparingThisAudio = Boolean(tts.isLoading && String(tts.currentMessageId || '') === String(groupOwnerId || ''));
  const isThisPlaying = Boolean(
    groupSequenceKey
    && tts.currentSequenceKey === groupSequenceKey
    && tts.isPlaying
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
  const [groupSceneImage, setGroupSceneImage] = useState(
    () => (Array.isArray(mensagens) ? mensagens : [])
      .map((mensagem) => mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null)
      .find(Boolean) || null
  );
  const [generatingScene, setGeneratingScene] = useState(false);

  useEffect(() => {
    const persistedSceneImage = (Array.isArray(mensagens) ? mensagens : [])
      .map((mensagem) => mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null)
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
      const response = await imageGenerationService.generate({
        entityType: 'cena',
        entityData: {
          narracao: groupPromptText,
          estilo_imagem: estiloImagem,
          temas: contextoImagemCena?.temas || [],
          contexto_historia: [
            contextoImagemCena?.historiaNome,
            contextoImagemCena?.historiaDescricao,
            contextoImagemCena?.historiaPrologo
          ].filter(Boolean).join(' | '),
          entidades: buildEntityPayload(groupEntityMentions)
        }
      });
      const url = response.data?.url;
      if (url) {
        setGroupSceneImage(url);
        onSceneImageGenerated?.(mensagens[0]?.id, url);
      }
    } catch (_) {
      // silent
    } finally {
      setGeneratingScene(false);
    }
  };

  const handleGroupAudio = async () => {
    if (!groupOwnerId) return;

    if (groupSequenceKey && tts.currentSequenceKey === groupSequenceKey) {
      tts.togglePause();
      return;
    }

    tts.playSequence(groupSequenceItems, groupOwnerId, {
      allowGenerate: true,
      sequenceKey: groupSequenceKey || groupOwnerId
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
                    disabled={isPreparingThisAudio}
                    className={`p-1.5 rounded-lg transition-all ${
                      isPreparingThisAudio
                        ? 'opacity-50 cursor-not-allowed text-purple-200'
                        : hasAnyAudio
                          ? 'hover:bg-purple-500/20 text-purple-300 hover:text-purple-100'
                          : 'hover:bg-amber-500/15 text-amber-300 hover:text-amber-100'
                    }`}
                    title={
                      isThisPlaying
                        ? 'Pausar audio do balao'
                        : hasAnyAudio
                          ? 'Ouvir audio do balao'
                          : 'Gerar e ouvir audio do balao'
                    }
                    aria-label={
                      isThisPlaying
                        ? 'Pausar audio do balao'
                        : hasAnyAudio
                          ? 'Ouvir audio do balao'
                          : 'Gerar e ouvir audio do balao'
                    }
                  >
                    {isPreparingThisAudio ? (
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
              <React.Fragment key={msg.id || i}>
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
              </React.Fragment>
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

export const renderJogador = (mensagem, key) => (
  <div key={key} className="max-w-[80%] ml-auto animate-fade-in">
    <div className="game-glass p-4 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.08)]">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          {mensagem.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cyan-300 font-semibold text-sm mb-1">
            {mensagem.username}
            {mensagem.personagem && (
              <span className="text-cyan-400/70 text-xs ml-1.5">
                {mensagem.personagem}
              </span>
            )}
          </p>
          <p className="text-white text-base leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const renderMestreStreaming = (mensagem, key) => {
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

/**
 * Registry: tipo â†' renderer (com aliases)
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
