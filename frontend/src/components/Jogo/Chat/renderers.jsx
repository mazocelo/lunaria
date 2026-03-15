import React, { useState, useMemo, useEffect } from 'react';
import MarkdownRenderer from '../../MarkdownRenderer';
import ConfirmationModal from '../../ConfirmationModal.jsx';
import { imageGenerationService } from '../../../services';
import ImageLightbox from '../../ImageLightbox.jsx';
import NarrationSegments, { buildNarrationSequenceItems } from '../../shared/NarrationSegments.jsx';

const getConteudo = (msg) => msg.message || msg.mensagem;
const RE_SOLICITACAO_DADOS = /(\u{1F3B2}\s*)?[Rr]ole/iu;

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
    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
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
      <div className={`glass p-6 rounded-xl border-2 shadow-2xl ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-4">
          <span className="text-4xl drop-shadow-lg">
            {temSolicitacaoDados ? '\u{1F3B2}' : '\u{1F3AD}'}
          </span>
          <div className="flex-1">
            <p className={`font-bold text-lg mb-2 ${
              temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
            }`}>
              Mestre {temSolicitacaoDados && '- Solicita Rolagem!'}
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
export const MestreMessage = ({ mensagem, voiceId, voiceProvider, tts, entidadesComImagem, contextoImagemCena, onSceneImageGenerated, estiloImagem }) => {
  const conteudo = getConteudo(mensagem);
  const temSolicitacaoDados = RE_SOLICITACAO_DADOS.test(conteudo);
  const isThisPlaying = String(tts.currentMessageId) === String(mensagem.id);
  const effectiveVoiceId = mensagem.voice_id || voiceId;
  const effectiveVoiceProvider = mensagem.voice_provider || voiceProvider;
  const segmentItems = useMemo(
    () => buildNarrationSequenceItems(mensagem.segmentos || [], mensagem.id, effectiveVoiceId, effectiveVoiceProvider),
    [mensagem.segmentos, mensagem.id, effectiveVoiceId, effectiveVoiceProvider]
  );
  const hasSegmentedNarration = segmentItems.length > 0;
  const hasCachedAudio = tts.hasAudioForMessage(mensagem.id);
  const hasPersistedAudio = Boolean(
    mensagem.audio_cache_key
    || mensagem.audio_url
    || mensagem.audioUrl
    || segmentItems.some((segment) => segment.hasPersistedAudio)
  );
  const hasAnyAudio = hasCachedAudio || hasPersistedAudio;
  const hasVoiceControls = Boolean(effectiveVoiceId || segmentItems.some((segment) => segment.voiceId));

  const [sceneImage, setSceneImage] = useState(
    mensagem.scene_image || mensagem.sceneImage || mensagem.imagem_cena || null
  );
  const [generatingScene, setGeneratingScene] = useState(false);
  const [sceneLightbox, setSceneLightbox] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [showConfirmAudio, setShowConfirmAudio] = useState(false);

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
    if (isThisPlaying) {
      tts.togglePause();
      return;
    }
    setShowConfirmAudio(true);
  };

  const confirmarGerarAudio = async () => {
    setShowConfirmAudio(false);

    if (hasSegmentedNarration) {
      await tts.playSequence(segmentItems, mensagem.id, {
        allowGenerate: true,
        forceRegenerate: hasAnyAudio,
        sequenceKey: `scene:${mensagem.id}`
      });
      return;
    }

    await tts.play(
      conteudo,
      effectiveVoiceId,
      mensagem.id,
      effectiveVoiceProvider,
      { allowGenerate: true, forceRegenerate: hasAnyAudio }
    );
  };

  return (
    <div className="w-full animate-fade-in">
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
      <div className={`glass p-6 rounded-xl border-2 shadow-2xl ${
        temSolicitacaoDados || mensagem.destaque
          ? 'border-amber-400/90 bg-gradient-to-br from-amber-900/80 to-orange-900/70 animate-pulse-slow'
          : 'border-purple-400/70 bg-gradient-to-br from-purple-900/40 to-pink-900/30'
      }`}>
        <div className="flex items-start space-x-4">
          <span className="text-4xl drop-shadow-lg">
            {temSolicitacaoDados ? '🎲' : '🎭'}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className={`font-bold text-lg ${
                temSolicitacaoDados ? 'text-amber-300' : 'text-purple-300'
              }`}>
                Mestre {temSolicitacaoDados && '- Solicita Rolagem!'}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleGenerateScene}
                  disabled={generatingScene}
                  className={`p-1.5 rounded-lg transition-all text-lg ${
                    generatingScene
                      ? 'bg-purple-500/30 text-purple-200'
                      : 'hover:bg-white/10 text-purple-400 hover:text-purple-200'
                  }`}
                  title={generatingScene ? 'Gerando ilustracao...' : 'Ilustrar cena'}
                >
                  {generatingScene ? (
                    <span className="inline-block w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                  ) : '🖼️'}
                </button>
                {hasVoiceControls && (
                  <button
                    onClick={handleGenerateAudio}
                    disabled={tts.isLoading && isThisPlaying}
                    className={`p-1.5 rounded-lg transition-all text-lg ${
                      isThisPlaying && tts.isPlaying
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'hover:bg-white/10 text-purple-400 hover:text-purple-200'
                    }`}
                    title={hasAnyAudio ? 'Gerar novamente (com confirmacao)' : 'Gerar audio'}
                  >
                    {tts.isLoading && isThisPlaying ? (
                      <span className="inline-block w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                    ) : isThisPlaying && tts.isPlaying ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
              {tts.lastError && tts.errorMessageId === mensagem.id && (
                <p className="text-red-400 text-xs mt-1 text-right">{tts.lastError}</p>
              )}
            </div>
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
            {sceneImage && (
              <div className="mt-3 relative group">
                <img src={sceneImage} alt="Ilustracao da cena" className="w-full max-h-64 object-cover rounded-lg border border-purple-500/30 cursor-pointer select-none caret-transparent" draggable={false} onClick={() => setSceneLightbox(true)} />
                <button
                  onClick={() => setSceneImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity select-none caret-transparent"
                >
                  <span className="text-xs">{'✕'}</span>
                </button>
                <ImageLightbox src={sceneImage} alt="Ilustracao da cena" isOpen={sceneLightbox} onClose={() => setSceneLightbox(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderJogador = (mensagem, key) => (
  <div key={key} className="w-full animate-fade-in">
    <div className="glass p-6 rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 shadow-xl">
      <div className="flex items-start space-x-4">
        <span className="text-3xl drop-shadow-lg">{'\u{2694}\u{FE0F}'}</span>
        <div className="flex-1">
          <p className="text-cyan-300 font-bold text-lg mb-2">
            {mensagem.username}
            {mensagem.personagem && (
              <span className="text-cyan-400 text-base ml-2">
                ({mensagem.personagem})
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

/**
 * Registry: tipo â†’ renderer (com aliases)
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
  jogador: renderJogador,
  player: renderJogador,
};



