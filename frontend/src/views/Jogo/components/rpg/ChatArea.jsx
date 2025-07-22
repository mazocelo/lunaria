import React from 'react';
import { RPGMessage } from '../../../../components/RPGMessage';

/**
 * Área central do chat do jogo RPG
 */
const ChatArea = ({ mensagens, usuariosDigitando }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-fantasy font-bold text-white mb-6 text-center">
          🎭 Narrativa do Mestre
        </h2>
        
        <div className="space-y-4 mb-6">
          {mensagens.length > 0 ? (
            mensagens.map((mensagem, index) => (
              <RPGMessage 
                key={mensagem.id || index} 
                message={mensagem}
                className="animate-fade-in"
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="glass p-8 rounded-2xl border border-purple-500/20">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-xl font-fantasy text-white mb-2">
                  A Aventura Começou!
                </h3>
                <p className="text-purple-300">
                  O Mestre iniciará a narrativa em breve...
                </p>
              </div>
            </div>
          )}
          
          {/* Indicador de usuários digitando */}
          {usuariosDigitando.length > 0 && (
            <div className="glass p-3 rounded-lg border border-purple-500/20">
              <div className="flex items-center space-x-2 text-purple-300 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>
                  {usuariosDigitando.join(', ')} {usuariosDigitando.length === 1 ? 'está' : 'estão'} digitando...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 