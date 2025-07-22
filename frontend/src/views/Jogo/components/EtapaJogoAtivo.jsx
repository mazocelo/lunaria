import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/theme.jsx';

/**
 * Componente para a etapa do jogo ativo
 */
const EtapaJogoAtivo = ({
  personagemSelecionado,
  webSocket,
  mensagens,
  mensagemAtual,
  setMensagemAtual,
  usuariosDigitando,
  participantes,
  onEnviarMensagem,
  onHandleKeyPress,
  onRolarDados,
  onVoltarSelecaoPersonagem
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Verificar se temos dados necessários
  if (!personagemSelecionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Personagem não encontrado</h2>
          <p className="text-purple-300 mb-6">Você precisa selecionar um personagem primeiro.</p>
          <button
            onClick={onVoltarSelecaoPersonagem}
            className="btn-rpg bg-gradient-to-r from-purple-600 to-cyan-600"
          >
            Voltar para Seleção
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info do personagem selecionado */}
      <div className="card-rpg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLight ? 'bg-cyan-100' : 'bg-cyan-500/20'}`}>
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h3 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {personagemSelecionado.nome}
              </h3>
              <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {personagemSelecionado.classe} • {personagemSelecionado.raca} • Nível {personagemSelecionado.nivel}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{personagemSelecionado.hp}</div>
              <div className="text-xs text-slate-400">HP</div>
            </div>
            <button 
              onClick={onVoltarSelecaoPersonagem}
              className="btn-rpg-secondary cursor-pointer px-4 py-2"
            >
              Trocar Personagem
            </button>
          </div>
        </div>

        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-modern bg-green-600/20 text-green-300 border border-green-500/30">
          <div className="w-2 h-2 rounded-full mr-2 bg-green-400" />
          Sessão Ativa
        </div>
      </div>

      {/* Área do Jogo */}
      <div className="card-rpg p-6">
        <h3 className={`text-2xl font-fantasy font-bold mb-6 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          🎭 Área de Jogo
        </h3>
        
        {/* Chat do Jogo */}
        <ChatSection
          mensagens={mensagens}
          mensagemAtual={mensagemAtual}
          setMensagemAtual={setMensagemAtual}
          usuariosDigitando={usuariosDigitando}
          participantes={participantes}
          webSocket={webSocket}
          onEnviarMensagem={onEnviarMensagem}
          onHandleKeyPress={onHandleKeyPress}
          isLight={isLight}
        />

        {/* Controles do Jogo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={onRolarDados}
            disabled={!webSocket.isAuthenticated}
            className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🎲</span>
            <span>Rolar Dados</span>
          </button>
          <button 
            onClick={() => navigate(`/ver-personagem/${personagemSelecionado.id}`)}
            className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4"
          >
            <span>📋</span>
            <span>Ver Ficha</span>
          </button>
          <button 
            onClick={() => webSocket.ping()}
            disabled={!webSocket.isConnected}
            className="btn-rpg-secondary flex items-center justify-center space-x-2 cursor-pointer py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>⚙️</span>
            <span>Ping</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente do chat
 */
const ChatSection = ({
  mensagens,
  mensagemAtual,
  setMensagemAtual,
  usuariosDigitando,
  participantes,
  webSocket,
  onEnviarMensagem,
  onHandleKeyPress,
  isLight
}) => {
  return (
    <div className={`rounded-xl p-6 mb-6 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          💬 Chat da Sessão
        </h4>
        <span className="text-xs text-slate-400 font-modern">
          {participantes.length} participantes
        </span>
      </div>
      
      <div className={`rounded-lg p-4 min-h-[200px] max-h-[300px] mb-4 overflow-y-auto ${isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-700'}`}>
        {mensagens.length > 0 ? (
          <div className="space-y-2">
            {mensagens.map((msg, index) => (
              <MensagemChat
                key={msg.id || index}
                mensagem={msg}
                isLight={isLight}
              />
            ))}
            
            {/* Indicador de usuários digitando */}
            {usuariosDigitando.length > 0 && (
              <div className="text-xs text-slate-400 italic">
                {usuariosDigitando.join(', ')} {usuariosDigitando.length === 1 ? 'está' : 'estão'} digitando...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500 font-modern text-sm py-8">
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
              <span className="text-xl">💬</span>
            </div>
            <p>Chat da sessão aparecerá aqui</p>
            <p className="text-xs mt-1">
              {webSocket.isConnected 
                ? 'Conectado - Envie uma mensagem!' 
                : 'Aguardando conexão...'
              }
            </p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        <input 
          type="text" 
          placeholder={webSocket.isAuthenticated ? "Digite sua mensagem..." : "Conectando..."}
          value={mensagemAtual}
          onChange={(e) => setMensagemAtual(e.target.value)}
          onKeyPress={onHandleKeyPress}
          disabled={!webSocket.isAuthenticated}
          className={`flex-1 px-4 py-3 rounded-lg border ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-900' 
              : 'bg-slate-700 border-slate-600 text-white'
          } placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50`}
        />
        <button 
          onClick={onEnviarMensagem}
          disabled={!webSocket.isAuthenticated || !mensagemAtual.trim()}
          className="btn-rpg-secondary px-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

/**
 * Componente individual de mensagem
 */
const MensagemChat = ({ mensagem, isLight }) => {
  const getMessageStyle = () => {
    switch (mensagem.type) {
      case 'system':
        return isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-300';
      case 'action_result':
        return isLight ? 'bg-green-50 text-green-700' : 'bg-green-500/10 text-green-300';
      default:
        return isLight ? 'bg-slate-50' : 'bg-slate-800/50';
    }
  };

  return (
    <div className={`p-2 rounded ${getMessageStyle()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {mensagem.user && (
            <span className={`text-sm font-semibold mr-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              {mensagem.user.username || mensagem.user.name}:
            </span>
          )}
          <span className={`text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {mensagem.message}
          </span>
        </div>
        <span className="text-xs text-slate-400 ml-2">
          {new Date(mensagem.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}; 


export default EtapaJogoAtivo;