import React, { useState, useMemo, useEffect } from 'react';
import MarkdownRenderer from '../../MarkdownRenderer';
import ConfirmationModal from '../../ConfirmationModal.jsx';
import { imageGenerationService } from '../../../services';
import ImageLightbox from '../../ImageLightbox.jsx';
import NarrationSegments, { buildNarrationSequenceItems } from '../../shared/NarrationSegments.jsx';
import { ImageIcon, Volume2, Play, Pause } from 'lucide-react';

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

export const renderDado = (mensagem, key) => {
  const modBase = (mensagem.modificador || 0) + (mensagem.bonusNivel || 0);
  const temModBase = modBase !== 0;
  const detalhes = mensagem.detalhesBonus || [];
  const temDetalhes = detalhes.length > 0;
  return (
    <div key={key} className="w-full animate-fade-in">
      <div className="glass p-4 rounded-xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-900/40 to-orange-900/40 shadow-xl">
        <div className="flex items-center justify-center space-x-3">
          <span className="text-4xl drop-shadow-lg">{'\u{1F3B2}'}</span>
          <div className="text-center">
            <p className="text-white font-bold text-base mb-1">
              {mensagem.username} rolou {mensagem.dice || 'd20'}
            </p>
            <p className="text-amber-300 text-2xl font-bold drop-shadow-lg">
              Resultado: {mensagem.rolagemBruta || mensagem.result || mensagem.valor || '?'}
              {temModBase && (
                <span className="text-lg">
                  {' '}{modBase > 0 ? '+' : ''}{modBase} ({mensagem.atributoNome || 'Sorte'})
                </span>
              )}
              {temDetalhes && detalhes.map((d, i) => (
                <span key={i} className="text-lg text-cyan-300">
                  {' '}{d.valor > 0 ? '+' : ''}{d.valor} ({d.fonte})
                </span>
              ))}
              {(temModBase || temDetalhes) && (
                <span className="text-lg"> = {mensagem.total}</span>
              )}
            </p>
            {mensagem.descricaoResultado && (
              <p className={`text-sm font-bold mt-1 ${mensagem.sucesso ? 'text-green-400' : 'text-red-400'}`}>
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
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-5 rounded-xl border-2 border-gray-500/40 bg-gray-900/30 shadow-lg">
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{'\u{1F4AC}'}</span>
        <div className="flex-1">
          <p className="text-gray-300 text-sm font-semibold mb-2">
            {mensagem.username} <span className="italic text-gray-400">(roleplay)</span>
          </p>
          <p className="text-gray-100 text-base italic leading-relaxed">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const renderLoading = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-4 rounded-xl border-2 border-purple-500/40 bg-purple-900/20">
      <div className="flex items-center justify-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
        </div>
        <p className="text-purple-300 font-semibold">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderCombate = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-5 rounded-xl border-2 border-red-500/60 bg-gradient-to-br from-red-900/30 to-orange-900/20 shadow-xl">
      <div className="flex items-start space-x-3">
        <span className="text-3xl drop-shadow-lg">{'\u{2694}\u{FE0F}'}</span>
        <div className="flex-1">
          <p className="text-red-300 font-bold text-sm mb-2">
            Combate
            {mensagem.critico && <span className="text-yellow-300 ml-2">ACERTO CRITICO!</span>}
          </p>
          <p className="text-white text-base leading-relaxed">
            {getConteudo(mensagem)}
          </p>
          {mensagem.dano > 0 && (
            <p className="text-orange-300 text-sm mt-1 font-semibold">
              -{mensagem.dano} HP
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const renderTransicaoTurno = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in my-3">
    <div className="glass p-3 rounded-xl border border-cyan-500/50 bg-cyan-900/20">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">{'\u{1F3C1}'}</span>
        <p className="text-cyan-200 font-semibold text-sm">
          {getConteudo(mensagem)}
        </p>
      </div>
    </div>
  </div>
);

export const renderAguardandoDados = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in my-3">
    <div className="glass border-2 border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">{'\u{23F3}'}</span>
        <p className="text-amber-300 font-semibold">
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
    <div key={key} className="w-full animate-fade-in">
      <div className="glass p-4 rounded-xl border border-emerald-500/40 bg-emerald-900/20 shadow-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{'\u2699\uFE0F'}</span>
          <div className="flex-1">
            <p className="text-emerald-300 font-semibold text-sm mb-1">
              Sistema de Jogo
            </p>
            <p className="text-white text-base leading-relaxed">
              {conteudo}
            </p>
            {payload?.personagem && (
              <p className="text-emerald-200/80 text-sm mt-1">
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
  <div key={key} className="w-full animate-fade-in my-8">
    <div className="glass p-8 rounded-2xl border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 shadow-2xl">
      <div className="text-center mb-4">
        <span className="text-6xl drop-shadow-lg">{'\u{1F31F}'}</span>
        <h3 className="text-3xl font-fantasy font-bold text-cyan-300 mt-3 drop-shadow-lg">
          {mensagem.titulo || 'Fim de Rodada'}
        </h3>
      </div>
      <p className="text-white text-xl leading-relaxed text-center">
        {getConteudo(mensagem) || mensagem.narrativa}
      </p>
    </div>
  </div>
);

export const renderMestre = (mensagem, key) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);

  return (
    <div key={key} className="w-full animate-fade-in">
      <div className={`glass p-4 rounded-xl border-2 shadow-2xl border-l-4 ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 border-l-amber-400/80 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 border-l-purple-400/60 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-3">
          <span className="text-2xl drop-shadow-lg mt-0.5">
            {temSolicitacaoDados ? '\u{1F3B2}' : '\u{1F3AD}'}
          </span>
          <div className="flex-1">
            <p className={`font-semibold text-sm uppercase tracking-wide mb-2 ${
              temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
            }`}>
              Mestre {temSolicitacaoDados && '\u{2014} Solicita Rolagem!'}
            </p>
            <MarkdownRenderer className="text-white text-lg leading-relaxed">
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
  const hasSegmentedNarration = segmentItems.length > 0;
  const isThisSequenceActive = Boolean(
    messageSequenceKey
    && tts.currentSequenceKey === messageSequenceKey
  );
  const isThisPlaying = isThisSequenceActive && tts.isPlaying;
  const hasCachedAudio = messageSequenceItems.some((item) => tts.hasAudioForItem?.(item.itemKey));
  const hasPersistedAudio = messageSequenceItems.some((item) => item.hasPersistedAudio);
  const hasAnyAudio = hasCachedAudio || hasPersistedAudio;
  const hasVoiceControls = messageSequenceItems.some((item) => item.voiceId);

  const [sceneImage, setSceneImage] = useState(
    mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null
  );
  const [generatingScene, setGeneratingScene] = useState(false);
  const [sceneLightbox, setSceneLightbox] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [showConfirmAudio, setShowConfirmAudio] = useState(false);
  const isGeneratingThis = String(tts.generatingMessageId) === String(mensagem.id);

  useEffect(() => {
    const persistedSceneImage = mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null;
    setSceneImage(persistedSceneImage);
  }, [mensagem.id, mensagem.scene_image, mensagem.sceneImage, mensagem.imagem_cena]);

  const entidadesMencionadas = useMemo(() => {
    if (!entidadesComImagem?.length || !conteudo) return [];
    const texto = conteudo.toLowerCase();
    return entidadesComImagem.filter((e) => texto.includes(e.nome.toLowerCase()));
  }, [conteudo, entidadesComImagem]);

  const handleGenerateScene = async () => {
    setGeneratingScene(true);
    try {
      const entidadePayload = entidadesMencionadas.map((e) => ({
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

      const response = await imageGenerationService.generate({
        entityType: 'cena',
        entityData: {
          narracao: conteudo,
          estilo_imagem: estiloImagem,
          temas: contextoImagemCena?.temas || [],
          contexto_historia: [
            contextoImagemCena?.historiaNome,
            contextoImagemCena?.historiaDescricao,
            contextoImagemCena?.historiaPrologo
          ].filter(Boolean).join(' | '),
          entidades: entidadePayload
        }
      });
      const url = response.data?.url;
      if (url) {
        setSceneImage(url);
        onSceneImageGenerated?.(mensagem.id, url);
      }
    } catch (_) {
      // silent
    }
    setGeneratingScene(false);
  };

  const handleGenerateAudio = () => {
    if (isGeneratingThis) return;
    if (hasAnyAudio) {
      setShowConfirmAudio(true);
      return;
    }
    confirmarGerarAudio();
  };

  const confirmarGerarAudio = async () => {
    setShowConfirmAudio(false);

    await tts.generateSequence(
      messageSequenceItems,
      mensagem.id,
      { forceRegenerate: hasAnyAudio }
    );
  };

  const handlePlayAudio = () => {
    if (isThisSequenceActive) {
      tts.togglePause();
      return;
    }

    tts.playSequence(
      messageSequenceItems,
      mensagem.id,
      {
        allowGenerate: false,
        sequenceKey: messageSequenceKey || `message:${mensagem.id}`
      }
    );
  };

  const innerContent = (
    <>
      <ConfirmationModal
        isOpen={showConfirmAudio}
        onClose={() => setShowConfirmAudio(false)}
        onConfirm={confirmarGerarAudio}
        title="Gerar Audio"
        message="Ja existe audio para esta mensagem. Deseja gerar novamente?"
        confirmText="Gerar"
        cancelText="Cancelar"
        type="info"
      />
      {!hideHeaderControls && (
        <div className="flex items-center justify-between mb-2">
          {(!grouped || isFirst) && (
            <p className={`font-semibold text-sm uppercase tracking-wide ${
              temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
            }`}>
              Mestre {temSolicitacaoDados && '— Solicita Rolagem!'}
            </p>
          )}
          {grouped && !isFirst && <div />}
          <div className="flex items-center gap-1">
            {hasVoiceControls && (
              <button
                onClick={handleGenerateAudio}
                disabled={isGeneratingThis}
                className={`p-1.5 rounded-lg transition-all text-lg ${
                  isGeneratingThis
                    ? 'opacity-50 cursor-not-allowed'
                    : hasAnyAudio
                      ? 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-200'
                      : 'hover:bg-amber-500/20 text-amber-400 hover:text-amber-200'
                }`}
                title={hasAnyAudio ? 'Regenerar audio' : 'Gerar audio'}
              >
                {isGeneratingThis ? (
                  <span className="inline-block w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                ) : <Volume2 size={18} />}
              </button>
            )}
            {hasVoiceControls && hasAnyAudio && (
              <button
                onClick={handlePlayAudio}
                className={`p-1.5 rounded-lg transition-all text-lg ${
                  isThisPlaying
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-200'
                }`}
                title={isThisPlaying ? 'Pausar' : 'Reproduzir audio'}
              >
                {isThisPlaying ? <Pause size={18} /> : <Play size={18} />}
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
        <MarkdownRenderer className="text-white text-lg leading-relaxed">
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
      {sceneImage ? (
        <div className="mt-3 relative group">
          <img src={sceneImage} alt="Ilustracao da cena" className="w-full max-h-64 object-cover rounded-lg border border-purple-500/30 cursor-pointer select-none caret-transparent" draggable={false} onClick={() => setSceneLightbox(true)} />
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleGenerateScene}
              disabled={generatingScene}
              className="p-1.5 bg-black/60 text-purple-300 hover:text-white rounded-full transition-all select-none caret-transparent"
              title={generatingScene ? 'Gerando ilustracao...' : 'Regerar ilustracao'}
            >
              {generatingScene ? (
                <span className="inline-block w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
              ) : <ImageIcon size={18} />}
            </button>
            <button
              onClick={() => setSceneImage(null)}
              className="p-1.5 bg-black/60 text-red-400 hover:text-white rounded-full transition-all select-none caret-transparent"
              title="Remover ilustracao"
            >
              <span className="text-xs">{'✕'}</span>
            </button>
          </div>
          <ImageLightbox src={sceneImage} alt="Ilustracao da cena" isOpen={sceneLightbox} onClose={() => setSceneLightbox(false)} />
        </div>
      ) : (
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleGenerateScene}
            disabled={generatingScene}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
              generatingScene
                ? 'glass-subtle text-purple-200'
                : 'hover:bg-white/10 text-purple-400/60 hover:text-purple-200'
            }`}
            title={generatingScene ? 'Gerando ilustracao...' : 'Ilustrar cena'}
          >
            {generatingScene ? (
              <span className="inline-block w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
            ) : <ImageIcon size={14} />}
            <span>{generatingScene ? 'Gerando...' : 'Ilustrar'}</span>
          </button>
        </div>
      )}
    </>
  );

  if (grouped) {
    return <div>{innerContent}</div>;
  }

  return (
    <div className="max-w-[88%] animate-fade-in">
      <div className={`glass p-4 rounded-xl border-2 shadow-[0_0_20px_rgba(139,92,246,0.08)] border-l-4 ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 border-l-amber-400/80 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 border-l-purple-400/60 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-3">
          <span className="text-2xl drop-shadow-lg mt-0.5">
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
  const [showConfirmAudio, setShowConfirmAudio] = useState(false);

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
  const isGeneratingThis = Boolean(
    groupOwnerId
    && String(tts.generatingMessageId || '') === String(groupOwnerId)
  );
  const isThisPlaying = Boolean(
    groupSequenceKey
    && tts.currentSequenceKey === groupSequenceKey
    && tts.isPlaying
  );

  const confirmarGerarAudio = async () => {
    setShowConfirmAudio(false);
    if (!groupOwnerId) return;

    await tts.generateSequence(groupSequenceItems, groupOwnerId, {
      forceRegenerate: hasAnyAudio
    });
  };

  const handleGenerateAudio = () => {
    if (isGeneratingThis || !groupOwnerId) return;
    if (hasAnyAudio) {
      setShowConfirmAudio(true);
      return;
    }
    confirmarGerarAudio();
  };

  const handlePlayAudio = () => {
    if (!groupOwnerId) return;

    if (groupSequenceKey && tts.currentSequenceKey === groupSequenceKey) {
      tts.togglePause();
      return;
    }

    tts.playSequence(groupSequenceItems, groupOwnerId, {
      allowGenerate: false,
      sequenceKey: groupSequenceKey || groupOwnerId
    });
  };

  return (
    <div className="max-w-[88%] animate-fade-in">
      <ConfirmationModal
        isOpen={showConfirmAudio}
        onClose={() => setShowConfirmAudio(false)}
        onConfirm={confirmarGerarAudio}
        title="Gerar Audio"
        message="Ja existe audio para esta mensagem. Deseja gerar novamente?"
        confirmText="Gerar"
        cancelText="Cancelar"
        type="info"
      />
      <div className="glass p-4 rounded-xl border-2 shadow-2xl border-l-4 border-purple-400/70 border-l-purple-400/60 bg-gradient-to-br from-purple-900/40 to-pink-900/30">
        <div className="flex items-start space-x-3">
          <span className="text-2xl drop-shadow-lg mt-0.5">{'\u{1F3AD}'}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm uppercase tracking-wide text-purple-300">
                Mestre
              </p>
              <div className="flex items-center gap-1">
                {hasVoiceControls && (
                  <button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingThis}
                    className={`p-1.5 rounded-lg transition-all text-lg ${
                      isGeneratingThis
                        ? 'opacity-50 cursor-not-allowed'
                        : hasAnyAudio
                          ? 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-200'
                          : 'hover:bg-amber-500/20 text-amber-400 hover:text-amber-200'
                    }`}
                    title={hasAnyAudio ? 'Regenerar audio da mensagem' : 'Gerar audio da mensagem'}
                  >
                    {isGeneratingThis ? (
                      <span className="inline-block w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    ) : <Volume2 size={18} />}
                  </button>
                )}
                {hasVoiceControls && hasAnyAudio && (
                  <button
                    onClick={handlePlayAudio}
                    className={`p-1.5 rounded-lg transition-all text-lg ${
                      isThisPlaying
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'hover:bg-purple-500/20 text-purple-400 hover:text-purple-200'
                    }`}
                    title={isThisPlaying ? 'Pausar audio da mensagem' : 'Reproduzir audio da mensagem'}
                  >
                    {isThisPlaying ? <Pause size={18} /> : <Play size={18} />}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderJogador = (mensagem, key) => (
  <div key={key} className="max-w-[80%] ml-auto animate-fade-in">
    <div className="glass p-4 rounded-xl border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.08)]">
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
      <div className="glass p-4 rounded-xl border-2 shadow-2xl border-l-4 border-purple-400/70 border-l-purple-400/60 bg-gradient-to-br from-purple-900/40 to-pink-900/30">
        <div className="flex items-start space-x-3">
          <span className="text-2xl drop-shadow-lg mt-0.5">{'\u{1F3AD}'}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm uppercase tracking-wide mb-2 text-purple-300">
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
