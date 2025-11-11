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
    
    // Debug: log do tipo e dados da mensagem
    if (tipo === 'dado' || tipo === 'dados' || tipo === 'dice_roll') {
      console.log('🎲 Renderizando dado:', { tipo, result: mensagem.result, dice: mensagem.dice, message: mensagem.message });
    }

    // Mensagem de resultado de dado
    if (tipo === 'dado' || tipo === 'dados' || tipo === 'dice_roll') {
      return (
        <div key={mensagem.id || index} className="w-full animate-fade-in">
          <div className="glass p-4 rounded-xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-900/40 to-orange-900/40 shadow-xl">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-4xl drop-shadow-lg">🎲</span>
              <div className="text-center">
                <p className="text-white font-bold text-base mb-1">
                  {mensagem.username} rolou {mensagem.dice || 'd20'}
                </p>
                <p className="text-amber-300 text-2xl font-bold drop-shadow-lg">
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
        <div key={mensagem.id || index} className="w-full animate-fade-in">
          <div className="glass p-5 rounded-xl border-2 border-gray-500/40 bg-gray-900/30 shadow-lg">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💬</span>
              <div className="flex-1">
                <p className="text-gray-300 text-sm font-semibold mb-2">
                  {mensagem.username} <span className="italic text-gray-400">(roleplay)</span>
                </p>
                <p className="text-gray-100 text-base italic leading-relaxed">
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
        <div key={mensagem.id || index} className="w-full animate-fade-in my-8">
          <div className="glass p-8 rounded-2xl border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-6xl drop-shadow-lg">🌟</span>
              <h3 className="text-3xl font-fantasy font-bold text-cyan-300 mt-3 drop-shadow-lg">
                {mensagem.titulo || 'Fim de Rodada'}
              </h3>
            </div>
            <p className="text-white text-xl leading-relaxed text-center">
              {mensagem.message || mensagem.mensagem || mensagem.narrativa}
            </p>
          </div>
        </div>
      );
    }

    // Mensagem do Mestre
    if (tipo === 'mestre') {
      return (
        <div key={mensagem.id || index} className="w-full animate-fade-in">
          <div className="glass p-6 rounded-xl border-2 border-purple-400/70 bg-gradient-to-br from-purple-900/40 to-pink-900/30 shadow-2xl">
            <div className="flex items-start space-x-4">
              <span className="text-4xl drop-shadow-lg">🎭</span>
              <div className="flex-1">
                <p className="text-purple-300 font-bold text-lg mb-2">Mestre</p>
                <p className="text-white text-lg leading-relaxed">
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
        <div key={mensagem.id || index} className="w-full animate-fade-in">
          <div className="glass p-6 rounded-xl border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 shadow-xl">
            <div className="flex items-start space-x-4">
              <span className="text-3xl drop-shadow-lg">⚔️</span>
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
                  {mensagem.message || mensagem.mensagem}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Mensagem padrão (usando componente RPGMessage)
    // Adicionar debug para ver por que está caindo aqui
    console.log('⚠️ Mensagem caiu no caso padrão (RPGMessage):', { 
      tipo,
      id: mensagem.id,
      username: mensagem.username,
      message: mensagem.message?.substring(0, 50)
    });
    
    return (
      <RPGMessage 
        key={mensagem.id || index} 
        message={{
          ...mensagem,
          type: mensagem.tipo || mensagem.type  // Garantir que type esteja definido
        }}
        className="animate-fade-in"
      />
    );
  };

  return (
    <div className="flex-1 px-4 py-6 overflow-y-auto">
      <div className="w-full">
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
          
          {/* Indicador de usuários digitando */}
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

          {/* Elemento invisível para scroll automático */}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatArea; 