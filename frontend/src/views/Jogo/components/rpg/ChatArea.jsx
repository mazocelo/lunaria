import React, { useRef, useEffect } from 'react';
import { RPGMessage } from '../../../../components/RPGMessage';

/**
 * Área central do chat do jogo RPG
 * 🎲 SISTEMA DE TURNOS: Exibe dados, mensagens roleplay e narrativas
 */
const ChatArea = ({ mensagens, usuariosDigitando }) => {
  const chatEndRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  /**
   * Renderizar mensagem baseada no tipo
   */
  const renderMensagem = (mensagem, index) => {
    const tipo = mensagem.tipo || mensagem.type;

    // Mensagem de resultado de dado
    if (tipo === 'dado' || tipo === 'dice_roll') {
      return (
        <div key={mensagem.id || index} className="flex justify-center animate-fade-in">
          <div className="glass p-4 rounded-xl border border-amber-500/50 bg-amber-900/20 max-w-md">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🎲</span>
              <div>
                <p className="text-white font-bold">
                  {mensagem.username} rolou {mensagem.dice || 'd20'}
                </p>
                <p className="text-amber-400 text-2xl font-bold">
                  Resultado: {mensagem.result || mensagem.valor}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mensagem roleplay (fora do turno)
    if (tipo === 'roleplay') {
      return (
        <div key={mensagem.id || index} className="animate-fade-in">
          <div className="glass p-3 rounded-lg border border-gray-500/30 bg-gray-900/20 max-w-2xl opacity-75">
            <div className="flex items-start space-x-2">
              <span className="text-sm">💬</span>
              <div className="flex-1">
                <p className="text-gray-400 text-xs mb-1">
                  {mensagem.username} <span className="italic">(roleplay)</span>
                </p>
                <p className="text-gray-300 text-sm italic">
                  {mensagem.message || mensagem.mensagem}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Narrativa entre rodadas
    if (tipo === 'entre_rodadas' || tipo === 'rodada_finalizada') {
      return (
        <div key={mensagem.id || index} className="flex justify-center animate-fade-in my-6">
          <div className="glass p-6 rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 max-w-3xl">
            <div className="text-center mb-3">
              <span className="text-4xl">🌟</span>
              <h3 className="text-2xl font-fantasy font-bold text-cyan-400 mt-2">
                {mensagem.titulo || 'Fim de Rodada'}
              </h3>
            </div>
            <p className="text-white text-lg leading-relaxed">
              {mensagem.message || mensagem.mensagem || mensagem.narrativa}
            </p>
          </div>
        </div>
      );
    }

    // Mensagem do Mestre
    if (tipo === 'mestre') {
      return (
        <div key={mensagem.id || index} className="animate-fade-in">
          <div className="glass p-4 rounded-xl border-2 border-purple-400/50 bg-purple-900/20 max-w-3xl">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎭</span>
              <div className="flex-1">
                <p className="text-purple-400 font-bold mb-1">Mestre</p>
                <p className="text-white leading-relaxed">
                  {mensagem.message || mensagem.mensagem}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mensagem de jogador
    if (tipo === 'jogador' || tipo === 'player') {
      return (
        <div key={mensagem.id || index} className="animate-fade-in">
          <div className="glass p-4 rounded-xl border border-cyan-500/30 bg-cyan-900/10 max-w-3xl ml-auto">
            <div className="flex items-start space-x-3">
              <span className="text-xl">⚔️</span>
              <div className="flex-1">
                <p className="text-cyan-400 font-semibold mb-1">
                  {mensagem.username}
                  {mensagem.personagem && (
                    <span className="text-cyan-300 text-sm ml-2">
                      ({mensagem.personagem})
                    </span>
                  )}
                </p>
                <p className="text-white">
                  {mensagem.message || mensagem.mensagem}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mensagem padrão (usando componente RPGMessage)
    return (
      <RPGMessage 
        key={mensagem.id || index} 
        message={mensagem}
        className="animate-fade-in"
      />
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-fantasy font-bold text-white mb-6 text-center">
          🎭 Narrativa do Mestre
        </h2>
        
        <div className="space-y-4 mb-6">
          {mensagens.length > 0 ? (
            mensagens.map((mensagem, index) => renderMensagem(mensagem, index))
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

          {/* Elemento invisível para scroll automático */}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 