import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../LoadingSpinner.jsx';
import { etapaSalaEsperaViewModel } from '../../../viewmodels/Jogo';

/**
 * Componente para sala de espera antes do jogo iniciar
 * 📍 Usado por: JogoView (etapa 'sala-espera')
 * 🎯 MIGRADO: Agora usa ViewModel específico para lógica de negócio
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

  // 🎯 ESTADO LOCAL
  const [iniciandoJogo, setIniciandoJogo] = useState(false);
  
  // 🎯 VIEWMODEL - Estado reativo
  const [viewModelState, setViewModelState] = useState(etapaSalaEsperaViewModel.getState());

  // 🔄 SUBSCRIBE AO VIEWMODEL
  useEffect(() => {
    const unsubscribe = etapaSalaEsperaViewModel.subscribe(setViewModelState);
    return unsubscribe;
  }, []);

  // 📊 DESTRUCTURING DO ESTADO
  const { linkCopiado } = viewModelState;

  // 🚀 INICIALIZAÇÃO
  useEffect(() => {
    etapaSalaEsperaViewModel.initialize();
    
    // Cleanup ao desmontar
    return () => {
      etapaSalaEsperaViewModel.destroy();
    };
  }, []);

  // 👥 LISTENERS PARA SINCRONIZAÇÃO DE JOGADORES VIA WEBSOCKET
  useEffect(() => {
    if (!socketConnected) return;

    const setupListeners = async () => {
      try {
        const { getSocketStoreAPI } = await import('../../../store/index.js');
        const { jogoViewModel } = await import('../../../viewmodels/Jogo');
        const socketStore = getSocketStoreAPI();

        // Listener para quando um jogador entra na sala
        const handleUserJoined = (data) => {
          console.log('👤 EtapaSalaEspera: Jogador (USUÁRIO) entrou na sala via WebSocket!');
          console.log('  - userId:', data.userId);
          console.log('  - username:', data.username);
          console.log('  - personagemNome:', data.personagemNome);
          console.log('  - personagemId:', data.personagemId);
          console.log('  - status:', data.status);
          
          // Verificar se é dono comparando userId com donoId da história (converter para string)
          const isOwner = historia?.id_usuario ? String(data.userId) === String(historia.id_usuario) : false;
          
          console.log('  - isOwner:', isOwner, '(historia.id_usuario:', historia?.id_usuario, ')');
          
          const novoParticipante = {
            userId: data.userId,
            username: data.username,
            personagem: data.personagemNome || 'Selecionando...',
            personagemNome: data.personagemNome,
            personagemId: data.personagemId,
            status: data.status || 'selecionando',
            isOwner: isOwner  // Usar valor calculado baseado no USUÁRIO
          };
          
          console.log('➕ EtapaSalaEspera: Adicionando à lista:', novoParticipante);
          jogoViewModel.adicionarParticipante(novoParticipante);
        };

        // Listener para quando um jogador sai da sala
        const handleUserLeft = (data) => {
          console.log('👋 EtapaSalaEspera: Jogador saiu da sala:', data);
          jogoViewModel.removerParticipante(data.userId);
        };

        // Listener para carregar lista inicial ao entrar na sala
        const handleRoomJoined = (data) => {
          console.log('🏠 EtapaSalaEspera: Entrou na sala, carregando jogadores (USUÁRIOS):', data);
          
          // Carregar lista inicial de jogadores já conectados
          if (data.sessao?.jogadoresConectados && Array.isArray(data.sessao.jogadoresConectados)) {
            // donoId vem da sessão (id do USUÁRIO que criou a história)
            const donoId = data.sessao.donoId;
            
            const jogadoresFormatados = data.sessao.jogadoresConectados.map(j => {
              // Comparar userId do jogador com donoId da história (converter ambos para string)
              const isOwner = String(j.userId) === String(donoId);
              
              return {
                userId: j.userId,
                username: j.username,
                personagem: j.personagemNome || 'Selecionando...',
                personagemId: j.personagemId,
                isOwner: isOwner  // Baseado no USUÁRIO, não no personagem
              };
            });
            
            console.log('📋 EtapaSalaEspera: Jogadores formatados com verificação de dono:', {
              donoId: donoId,
              jogadores: jogadoresFormatados.map(j => ({ userId: j.userId, username: j.username, isOwner: j.isOwner }))
            });
            
            jogoViewModel.atualizarParticipantes(jogadoresFormatados);
          }
        };

        // Adicionar listeners
        socketStore.on('user_joined', handleUserJoined);
        socketStore.on('user_left', handleUserLeft);
        socketStore.on('room_joined', handleRoomJoined);

        console.log('📡 EtapaSalaEspera: Listeners de jogadores configurados');

        // Cleanup
        return () => {
          socketStore.off('user_joined', handleUserJoined);
          socketStore.off('user_left', handleUserLeft);
          socketStore.off('room_joined', handleRoomJoined);
          console.log('🧹 EtapaSalaEspera: Listeners de jogadores removidos');
        };
      } catch (error) {
        console.error('❌ EtapaSalaEspera: Erro ao configurar listeners:', error);
      }
    };

    setupListeners();
  }, [socketConnected]);

  // 📋 HELPERS: Formatar dados via ViewModel
  const infoHistoria = etapaSalaEsperaViewModel.formatarInformacoesHistoria(historia);
  const infoPersonagem = etapaSalaEsperaViewModel.formatarInformacoesPersonagem(personagemSelecionado);
  const participantesFormatados = etapaSalaEsperaViewModel.formatarParticipantes(participantes, user);
  const connectionStatus = etapaSalaEsperaViewModel.getConnectionStatus(socketConnected);
  
  // 🔍 DEBUG: Estado da renderização
  console.log('🎭 EtapaSalaEspera: Estado atual da renderização:');
  console.log('  - participantes (raw):', participantes);
  console.log('  - participantesFormatados:', participantesFormatados);
  console.log('  - isDonoSala:', isDonoSala);
  console.log('  - salaAberta:', salaAberta);
  console.log('  - userId atual:', user?.id);
  console.log('  - socketConnected:', socketConnected);
  
  // 🎯 HANDLERS: Delegar para callback (view gerencia API)
  const handleIniciarJogo = async () => {
    if (!onIniciarJogo) {
      console.warn('⚠️ EtapaSalaEspera: onIniciarJogo não definido');
      return;
    }
    
    setIniciandoJogo(true);
    try {
      console.log('🚀 EtapaSalaEspera: Chamando onIniciarJogo...');
      await onIniciarJogo();
      console.log('✅ EtapaSalaEspera: onIniciarJogo concluído');
    } catch (error) {
      console.error('❌ EtapaSalaEspera: Erro em onIniciarJogo:', error);
    } finally {
      setIniciandoJogo(false);
    }
  };

  const handleTrocarPersonagem = () => {
    onVoltar();
  };

  const handleCompartilharSala = async () => {
    await etapaSalaEsperaViewModel.compartilharSala();
  };

  // 🎯 VALIDAÇÕES: Via ViewModel
  const validacaoIniciarJogo = etapaSalaEsperaViewModel.validarIniciarJogo(isDonoSala, salaAberta, iniciandoJogo);
  const validacaoTrocarPersonagem = etapaSalaEsperaViewModel.validarTrocarPersonagem(personagemSelecionado);

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
            {infoHistoria.titulo}
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-modern border ${connectionStatus.bgColor} ${connectionStatus.color} ${connectionStatus.borderColor}`}>
              <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {connectionStatus.text}
            </div>
            <div className="text-purple-300 text-sm">
              {participantesFormatados.length} jogador{participantesFormatados.length !== 1 ? 'es' : ''} conectado{participantesFormatados.length !== 1 ? 's' : ''}
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
                {infoHistoria.descricao}
              </p>
              
              {infoHistoria.temas && (
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    🎭 {infoHistoria.temas.join(', ')}
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
                  <h4 className="text-lg font-bold text-white">{infoPersonagem.nome}</h4>
                  <p className="text-cyan-300">
                    {infoPersonagem.classe} • {infoPersonagem.raca} • Nível {infoPersonagem.nivel}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-red-400">❤️ {infoPersonagem.hp} HP</span>
                    <span className="text-blue-400">🔮 {infoPersonagem.mp} MP</span>
                  </div>
                </div>
                <button 
                  onClick={handleTrocarPersonagem}
                  className="btn-rpg-secondary px-4 py-2 text-sm"
                >
                  {validacaoTrocarPersonagem.acao}
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
                    <span>Você é o Dono desta aventura</span>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    Quando estiver pronto, inicie a aventura para todos os jogadores.
                  </p>
                  <button
                    onClick={handleIniciarJogo}
                    disabled={iniciandoJogo || !validacaoIniciarJogo.podeIniciar}
                    className={`
                      w-full btn-rpg h-12 text-lg font-bold
                      bg-gradient-to-r from-yellow-600 to-orange-600 
                      hover:from-yellow-500 hover:to-orange-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 transform hover:scale-105
                    `}
                    title={validacaoIniciarJogo.motivo || ''}
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
                    <span className="ml-2">Aguardando o Dono iniciar a aventura...</span>
                  </div>
                  <p className="text-purple-400 text-sm">
                    O Dono da sala irá iniciar quando todos estiverem prontos.
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
                  {participantesFormatados.length}
                </span>
              </h3>
              
              <div className="space-y-3">
                {participantesFormatados.map((participante, index) => (
                  <div key={participante.userId || index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold">
                      {participante.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {participante.username}
                        {participante.isCurrentUser && (
                          <span className="text-cyan-400 text-xs ml-2">(Você)</span>
                        )}
                        {participante.isOwner && (
                          <span className="text-yellow-400 text-xs ml-2">👑 Dono</span>
                        )}
                      </div>
                      <div className="text-xs">
                        {participante.personagem && participante.personagem !== 'Selecionando...' ? (
                          <span className="text-green-300">
                            <span className="text-green-400">✓ Pronto:</span> {participante.personagem}
                          </span>
                        ) : (
                          <span className="text-yellow-300">⏳ Selecionando Personagem</span>
                        )}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                ))}
              </div>

              {participantesFormatados.length === 0 && (
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
                  onClick={handleCompartilharSala}
                  className="w-full btn-rpg h-10 text-sm font-bold flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  <span>{linkCopiado ? '✅' : '🔗'}</span>
                  <span>{linkCopiado ? 'Link Copiado!' : 'Compartilhar Sala'}</span>
                </button>
                
                {isDonoSala && (
                  <button
                    onClick={handleIniciarJogo}
                    disabled={iniciandoJogo || !salaAberta}
                    className={`
                      w-full btn-rpg h-10 text-sm font-bold flex items-center justify-center space-x-2
                      bg-gradient-to-r from-yellow-600 to-orange-600 
                      hover:from-yellow-500 hover:to-orange-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                    `}
                  >
                    <span>{iniciandoJogo ? '⏳' : '🚀'}</span>
                    <span>{iniciandoJogo ? 'Iniciando...' : 'Iniciar Jogo'}</span>
                  </button>
                )}
                
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