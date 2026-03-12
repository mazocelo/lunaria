import React, { useRef, useEffect } from 'react';
import { RPGMessage } from '../../RPGMessage';
import { MESSAGE_RENDERERS, MestreMessage } from './renderers';
import { useTTS } from '../../../hooks/useTTS';

/**
 * Área central do chat do jogo RPG
 * Despacha renderização por tipo via MESSAGE_RENDERERS registry
 * Uma única instância de useTTS garante que só 1 áudio toque por vez
 */
const ChatArea = ({ mensagens, usuariosDigitando, voiceId, voiceProvider, entidadesComImagem, onSceneImageGenerated }) => {
  const chatEndRef = useRef(null);
  const tts = useTTS();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const renderMensagem = (mensagem, index) => {
    const tipo = mensagem.tipo || mensagem.type;
    const key = mensagem.id || index;

    // Mestre messages use React component (supports TTS)
    if (tipo === 'mestre') {
      return <MestreMessage key={key} mensagem={mensagem} voiceId={voiceId} voiceProvider={voiceProvider} tts={tts} entidadesComImagem={entidadesComImagem} onSceneImageGenerated={onSceneImageGenerated} />;
    }

    const renderer = MESSAGE_RENDERERS[tipo];
    if (renderer) {
      return renderer(mensagem, key);
    }

    // Fallback: componente RPGMessage
    return (
      <RPGMessage
        key={key}
        message={{ ...mensagem, type: tipo }}
        className="animate-fade-in"
      />
    );
  };

  return (
    <div className="flex-1 px-6 pt-6 pb-6 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-5 mb-6">
          {mensagens.length > 0 ? (
            mensagens.map((mensagem, index) => renderMensagem(mensagem, index))
          ) : (
            <div className="text-center py-12">
              <div className="glass p-10 rounded-2xl border-2 border-purple-500/40 shadow-2xl">
                <div className="text-7xl mb-4 animate-pulse">📜</div>
                <h3 className="text-2xl font-fantasy text-white mb-3 font-bold">
                  A Aventura Começou!
                </h3>
                <p className="text-purple-200 text-lg">
                  O Mestre iniciará a narrativa em breve...
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
                  {usuariosDigitando.join(', ')} {usuariosDigitando.length === 1 ? 'está' : 'estão'} digitando...
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
