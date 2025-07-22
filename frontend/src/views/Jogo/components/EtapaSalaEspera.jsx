import React, { useState } from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';

/**
 * Componente para sala de espera antes do jogo iniciar
 * 📍 Usado por: JogoView (etapa 'sala-espera')
 */
const EtapaSalaEspera = ({
  historia,
  personagemSelecionado,
  participantes,
  isDonoSala,
  salaAberta,
  socketConnected,
  roomUsers,
  onIniciarJogo,
  onSair,
  onVoltar
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';
  const [iniciandoJogo, setIniciandoJogo] = useState(false);
  
  const participantesSeguros = participantes || [];
  const historiaSegura = historia || {};
  
  const handleIniciarJogo = async () => {
    if (!isDonoSala || iniciandoJogo) return;
    
    setIniciandoJogo(true);
    try {
      await onIniciarJogo();
    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
    } finally {
      setIniciandoJogo(false);
    }
  };

  const handleTrocarPersonagem = () => {
    // Se não há personagem selecionado, volta para seleção
    // Se há personagem, volta para seleção para trocar
    onVoltar();
  };

  // Status de conexão para exibição
  const getConnectionStatus = () => {
    if (!socketConnected) {
      return {
        text: 'Desconectado',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: '🔴'
      };
    }
    return {
      text: 'Conectado à Sala',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: '🟢'
    };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header da sala */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fantasy font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🏰 Sala de Espera
          </h1>
          <p className="text-xl text-purple-200 font-modern">
            {historiaSegura.titulo}
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-modern border ${connectionStatus.bgColor} ${connectionStatus.color} ${connectionStatus.borderColor}`}>
              <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {connectionStatus.text}
            </div>
            <div className="text-purple-300 text-sm">
              {participantesSeguros.length} jogador{participantesSeguros.length !== 1 ? 'es' : ''} conectado{participantesSeguros.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações da História */}
          <div className="lg:col-span-2 space-y-6">
            {/* História */}
            <div className="glass p-6 rounded-2xl border border-purple-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center">
                📖 História
              </h3>
              <p className="text-purple-200 leading-relaxed">
                {historiaSegura.descricao || 'Uma aventura épica está prestes a começar...'}
              </p>
              
              {historiaSegura.tema && (
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    🎭 {historiaSegura.tema}
                  </span>
                </div>
              )}
            </div>

            {/* Seu Personagem */}
            <div className="glass p-6 rounded-2xl border border-cyan-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center">
                👤 Seu Personagem
              </h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-2xl">
                  ⚔️
                </div>
                <div className="flex-1">
                  {personagemSelecionado ? (
                    <>
                      <h4 className="text-lg font-bold text-white">{personagemSelecionado.nome}</h4>
                      <p className="text-cyan-300">
                        {personagemSelecionado.classe} • {personagemSelecionado.raca} • Nível {personagemSelecionado.nivel}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-red-400">❤️ {personagemSelecionado.hp || '???'} HP</span>
                        <span className="text-blue-400">🔮 {personagemSelecionado.mp || '???'} MP</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-bold text-white">Carregando personagem...</h4>
                      <p className="text-cyan-300">Aguarde um momento</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-400">❤️ ??? HP</span>
                        <span className="text-gray-400">🔮 ??? MP</span>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={handleTrocarPersonagem}
                  className="btn-rpg-secondary px-4 py-2 text-sm"
                >
                  {personagemSelecionado ? 'Trocar' : 'Selecionar'}
                </button>
              </div>
            </div>

            {/* Status da Aventura */}
            <div className="glass p-6 rounded-2xl border border-yellow-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center">
                ⏳ Status da Aventura
              </h3>
              
              {isDonoSala ? (
                <div className="space-y-4">
                  <div className="flex items-center text-yellow-300">
                    <span className="text-lg mr-2">👑</span>
                    <span>Você é o Mestre desta aventura</span>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    Quando estiver pronto, inicie a aventura para todos os jogadores.
                  </p>
                  <button
                    onClick={handleIniciarJogo}
                    disabled={iniciandoJogo || !salaAberta}
                    className={`
                      w-full btn-rpg h-12 text-lg font-bold
                      bg-gradient-to-r from-yellow-600 to-orange-600 
                      hover:from-yellow-500 hover:to-orange-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 transform hover:scale-105
                    `}
                  >
                    {iniciandoJogo ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Iniciando Jogo...</span>
                      </div>
                    ) : (
                      '🚀 Iniciar Jogo'
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-purple-300 mb-2">
                    <span className="text-lg">⏳</span>
                    <span className="ml-2">Aguardando o Mestre iniciar a aventura...</span>
                  </div>
                  <p className="text-purple-400 text-sm">
                    O Mestre da história irá iniciar quando todos estiverem prontos.
                  </p>
                  {!personagemSelecionado && (
                    <p className="text-yellow-300 text-sm mt-2">
                      ⚠️ Você precisa selecionar um personagem primeiro
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Painel de Jogadores */}
          <div className="space-y-6">
            {/* Lista de Jogadores */}
            <div className="glass p-6 rounded-2xl border border-green-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center justify-between">
                <span>👥 Jogadores</span>
                <span className="text-sm font-normal text-green-300">
                  {participantesSeguros.length}
                </span>
              </h3>
              
              <div className="space-y-3">
                {participantesSeguros.map((participante, index) => (
                  <div key={participante.userId || index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                      {participante.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {participante.username || 'Jogador Anônimo'}
                        {participante.userId === user?.id && (
                          <span className="text-cyan-400 text-xs ml-2">(Você)</span>
                        )}
                        {participante.isOwner && (
                          <span className="text-yellow-400 text-xs ml-2">👑 Mestre</span>
                        )}
                      </div>
                      <div className="text-green-300 text-xs">
                        {participante.personagem || participante.personagemNome || 'Selecionando personagem...'}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                ))}
              </div>

              {participantesSeguros.length === 0 && (
                <div className="text-center py-8 text-purple-400">
                  <div className="text-4xl mb-2">👻</div>
                  <p>Aguardando jogadores...</p>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="glass p-6 rounded-2xl border border-blue-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center">
                ⚙️ Controles
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 text-sm">Status WebSocket:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${connectionStatus.color}`}>
                      {connectionStatus.icon}
                    </span>
                    <span className={`text-xs ${connectionStatus.color}`}>
                      {connectionStatus.text}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 text-sm">Etapa:</span>
                  <span className="text-white text-sm">🏰 Sala de Espera</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 text-sm">Pode Iniciar:</span>
                  <span className="text-yellow-300 text-sm">⏳ Aguardando</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={onSair}
                  className="w-full btn-rpg-secondary h-10 text-sm font-bold flex items-center justify-center space-x-2"
                >
                  <span>🚪</span>
                  <span>Sair da Sala</span>
                </button>
                
                {!socketConnected && (
                  <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-300 text-xs text-center">
                      ⚠️ Conexão perdida. Tentando reconectar automaticamente...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 

export default EtapaSalaEspera;