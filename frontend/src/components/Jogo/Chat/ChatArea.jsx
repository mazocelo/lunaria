import React, { useRef, useEffect, useMemo } from 'react';
import { RPGMessage } from '../../RPGMessage';
import { MESSAGE_RENDERERS, MestreMessage } from './renderers';
import { useTTS } from '../../../hooks/useTTS';

/**
 * Area central do chat do jogo RPG
 * Despacha renderizacao por tipo via MESSAGE_RENDERERS registry
 * Uma unica instancia de useTTS garante que so 1 audio toque por vez
 */
const ChatArea = ({ mensagens, usuariosDigitando, voiceId, voiceProvider, entidadesComImagem, contextoImagemCena, onSceneImageGenerated, estiloImagem }) => {
  const chatEndRef = useRef(null);
  const tts = useTTS();
  const currentTtsMessage = useMemo(
    () => mensagens.find(m => String(m.id) === String(tts.currentMessageId)),
    [mensagens, tts.currentMessageId]
  );

  const formatTime = (seconds) => {
    const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const min = Math.floor(safe / 60);
    const sec = String(safe % 60).padStart(2, '0');
    return `${min}:${sec}`;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const renderMensagem = (mensagem, index) => {
    const tipo = mensagem.tipo || mensagem.type;
    const key = mensagem.id || index;

    if (tipo === 'mestre') {
      return (
        <MestreMessage
          key={key}
          mensagem={mensagem}
          voiceId={voiceId}
          voiceProvider={voiceProvider}
          tts={tts}
          entidadesComImagem={entidadesComImagem}
          contextoImagemCena={contextoImagemCena}
          onSceneImageGenerated={onSceneImageGenerated}
          estiloImagem={estiloImagem}
        />
      );
    }

    const renderer = MESSAGE_RENDERERS[tipo];
    if (renderer) return renderer(mensagem, key);

    return (
      <RPGMessage
        key={key}
        message={{ ...mensagem, type: tipo }}
        className="animate-fade-in"
      />
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-5 mb-6">
            {mensagens.length > 0 ? (
              mensagens.map((mensagem, index) => renderMensagem(mensagem, index))
            ) : (
              <div className="text-center py-12">
                <div className="glass p-10 rounded-2xl border-2 border-purple-500/40 shadow-2xl">
                  <div className="text-7xl mb-4 animate-pulse">{'\u{1F4DC}'}</div>
                  <h3 className="text-2xl font-fantasy text-white mb-3 font-bold">
                    A Aventura Comecou!
                  </h3>
                  <p className="text-purple-200 text-lg">
                    O Mestre iniciara a narrativa em breve...
                  </p>
                </div>
              </div>
            )}

            {usuariosDigitando.length > 0 && (
              <div className="glass p-4 rounded-xl border-2 border-purple-500/40 shadow-lg">
                <div className="flex items-center space-x-3 text-purple-200 text-base">
                  <div className="flex space-x-1">
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

      {tts.currentMessageId != null && (
        <div className="px-6 pb-3">
          <div className="w-full max-w-4xl mx-auto">
            <div className="glass p-3 rounded-xl border border-purple-500/40 bg-black/20">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={tts.togglePause}
                  className="px-2 py-1 rounded-md text-sm bg-purple-600/40 text-purple-100 hover:bg-purple-600/60 transition-all"
                >
                  {tts.isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={tts.stop}
                  className="px-2 py-1 rounded-md text-sm bg-red-600/30 text-red-100 hover:bg-red-600/50 transition-all"
                >
                  Stop
                </button>
                <button
                  onClick={tts.cyclePlaybackRate}
                  className="px-2 py-1 rounded-md text-sm bg-cyan-600/30 text-cyan-100 hover:bg-cyan-600/50 transition-all"
                  title="Velocidade de reproducao"
                >
                  {`${tts.playbackRate}x`}
                </button>
                <span className="text-xs text-purple-200 truncate">
                  {currentTtsMessage?.message || currentTtsMessage?.mensagem || 'Narracao do mestre'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300 w-10 text-right">{formatTime(tts.currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={tts.duration || 0}
                  step="0.1"
                  value={Math.min(tts.currentTime || 0, tts.duration || 0)}
                  onChange={(e) => tts.seekTo(e.target.value)}
                  className="flex-1 accent-purple-400"
                  disabled={!tts.duration}
                />
                <span className="text-xs text-purple-300 w-10">{formatTime(tts.duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
