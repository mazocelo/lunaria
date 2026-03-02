import React, { useRef, useEffect } from 'react';
import { RPGMessage } from '../../RPGMessage';
import MarkdownRenderer from '../../MarkdownRenderer';

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

  // Helpers de conteúdo
  const getConteudo = (msg) => msg.message || msg.mensagem;

  // Renderers por tipo de mensagem
  const renderDado = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in">
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

  const renderRoleplay = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in">
      <div className="glass p-5 rounded-xl border-2 border-gray-500/40 bg-gray-900/30 shadow-lg">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💬</span>
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

  const renderLoading = (mensagem, key) => (
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

  const renderCombate = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in">
      <div className="glass p-5 rounded-xl border-2 border-red-500/60 bg-gradient-to-br from-red-900/30 to-orange-900/20 shadow-xl">
        <div className="flex items-start space-x-3">
          <span className="text-3xl drop-shadow-lg">⚔️</span>
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

  const renderTransicaoTurno = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in my-3">
      <div className="glass p-3 rounded-xl border border-cyan-500/50 bg-cyan-900/20">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-2xl">🏁</span>
          <p className="text-cyan-200 font-semibold text-sm">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderAguardandoDados = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in my-3">
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-2xl">⏳</span>
          <p className="text-amber-300 font-semibold">
            {getConteudo(mensagem)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderEntreRodadas = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in my-8">
      <div className="glass p-8 rounded-2xl border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-900/40 to-purple-900/40 shadow-2xl">
        <div className="text-center mb-4">
          <span className="text-6xl drop-shadow-lg">🌟</span>
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

  const renderMestre = (mensagem, key) => {
    const conteudo = getConteudo(mensagem);
    const temSolicitacaoDados = /🎲.*[Rr]ole/i.test(conteudo);

    return (
      <div key={key} className="w-full animate-fade-in">
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

  const renderJogador = (mensagem, key) => (
    <div key={key} className="w-full animate-fade-in">
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
              {getConteudo(mensagem)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Mapa de tipo → renderer (suporta aliases)
  const messageRenderers = {
    dado: renderDado,
    dados: renderDado,
    dice_roll: renderDado,
    roleplay: renderRoleplay,
    loading: renderLoading,
    combate: renderCombate,
    transicao_turno: renderTransicaoTurno,
    aguardando_dados: renderAguardandoDados,
    entre_rodadas: renderEntreRodadas,
    rodada_finalizada: renderEntreRodadas,
    mestre: renderMestre,
    jogador: renderJogador,
    player: renderJogador,
  };

  /**
   * Renderizar mensagem baseada no tipo
   */
  const renderMensagem = (mensagem, index) => {
    const tipo = mensagem.tipo || mensagem.type;
    const key = mensagem.id || index;
    const renderer = messageRenderers[tipo];

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
    <div className="flex-1 px-4 pt-6 pb-6 overflow-y-auto">
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