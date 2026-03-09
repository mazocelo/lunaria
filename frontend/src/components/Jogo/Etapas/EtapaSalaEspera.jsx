import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../contexts/theme.jsx';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../LoadingSpinner.jsx';
import { useSocketStore, useGameStore, useTemaStore } from '../../../store/index.js';

/**
 * Componente para sala de espera antes do jogo iniciar
 * Usado por: JogoView (etapa 'sala-espera')
 * Refatorado: Usa hooks diretos (useSocketStore, useGameStore, useTemaStore) no lugar de ViewModels
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

  // Stores diretos
  const getNomesDeTemas = useTemaStore(s => s.getNomesDeTemas);
  const socketOn = useSocketStore(s => s.on);
  const socketOff = useSocketStore(s => s.off);
  const gameStoreSetParticipantes = useGameStore(s => s.setParticipantes);
  const gameStoreAdicionarParticipante = useGameStore(s => s.adicionarParticipante);
  const gameStoreRemoverParticipante = useGameStore(s => s.removerParticipante);

  // Estado local
  const [iniciandoJogo, setIniciandoJogo] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const copiarTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiarTimeoutRef.current) {
        clearTimeout(copiarTimeoutRef.current);
      }
    };
  }, []);

  // Listeners para sincronizacao de jogadores via WebSocket
  useEffect(() => {
    if (!socketConnected) return;

    // Listener para quando um jogador entra na sala
    const handleUserJoined = (data) => {
      const isOwner = historia?.id_usuario ? String(data.userId) === String(historia.id_usuario) : false;

      const novoParticipante = {
        userId: data.userId,
        username: data.username,
        personagem: data.personagemNome || 'Selecionando...',
        personagemNome: data.personagemNome,
        personagemId: data.personagemId,
        status: data.status || 'selecionando',
        isOwner: isOwner
      };

      // Adicionar via gameStore (equivalente ao antigo jogoViewModel.adicionarParticipante)
      // O parent page hook gerencia participantes via gameStore
      if (gameStoreAdicionarParticipante) {
        gameStoreAdicionarParticipante(novoParticipante);
      }
    };

    // Listener para quando um jogador sai da sala
    const handleUserLeft = (data) => {
      if (gameStoreRemoverParticipante) {
        gameStoreRemoverParticipante(data.userId);
      }
    };

    // Listener para carregar lista inicial ao entrar na sala
    const handleRoomJoined = (data) => {
      if (data.sessao?.jogadoresConectados && Array.isArray(data.sessao.jogadoresConectados)) {
        const donoId = data.sessao.donoId;

        const jogadoresFormatados = data.sessao.jogadoresConectados.map(j => {
          const isOwner = String(j.userId) === String(donoId);
          return {
            userId: j.userId,
            username: j.username,
            personagem: j.personagemNome || 'Selecionando...',
            personagemId: j.personagemId,
            isOwner: isOwner
          };
        });

        if (gameStoreSetParticipantes) {
          gameStoreSetParticipantes(jogadoresFormatados);
        }
      }
    };

    // Adicionar listeners
    socketOn('user_joined', handleUserJoined);
    socketOn('user_left', handleUserLeft);
    socketOn('room_joined', handleRoomJoined);

    return () => {
      socketOff('user_joined', handleUserJoined);
      socketOff('user_left', handleUserLeft);
      socketOff('room_joined', handleRoomJoined);
    };
  }, [socketConnected, historia, socketOn, socketOff, gameStoreSetParticipantes, gameStoreAdicionarParticipante, gameStoreRemoverParticipante]);

  // --- Helpers inline (antes no ViewModel) ---

  const formatarInformacoesHistoria = useCallback((hist) => {
    if (!hist) {
      return { titulo: 'Historia sem nome', descricao: 'Uma aventura epica esta prestes a comecar...', temas: null };
    }
    const titulo = hist.nome || hist.titulo || 'Historia sem nome';
    const descricao = hist.prologo || 'Uma aventura epica esta prestes a comecar...';
    const temas = getNomesDeTemas(hist.temas);
    return { titulo, descricao, temas };
  }, [getNomesDeTemas]);

  const formatarInformacoesPersonagem = useCallback((p) => {
    if (!p) {
      return { nome: 'Carregando personagem...', classe: 'Aguarde um momento', raca: '', nivel: '', hp: '???', mp: '???' };
    }
    return {
      nome: p.nome || 'Personagem sem nome',
      classe: p.classe_nome || p.classe || 'Desconhecida',
      raca: p.raca_nome || p.raca || 'Desconhecida',
      nivel: p.nivel || '1',
      hp: p.hp_atual || p.hp || '???',
      mp: p.mp_atual || p.mp || '???',
    };
  }, []);

  const formatarParticipantes = useCallback((parts, usr) => {
    if (!Array.isArray(parts)) return [];
    return parts.map(participante => {
      const personagemExibicao = participante.personagem || participante.personagemNome || 'Selecionando personagem...';
      return {
        ...participante,
        username: participante.username || 'Jogador Anonimo',
        personagem: personagemExibicao,
        isCurrentUser: participante.userId === usr?.id,
        isOwner: participante.isOwner || false
      };
    });
  }, []);

  const getConnectionStatus = useCallback((connected) => {
    if (!connected) {
      return { text: 'Desconectado', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', icon: '🔴' };
    }
    return { text: 'Conectado a Sala', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30', icon: '🟢' };
  }, []);

  const validarIniciarJogo = useCallback((isDono, sala, iniciando) => {
    if (!isDono) return { podeIniciar: false, motivo: 'Apenas o Mestre pode iniciar o jogo' };
    if (iniciando) return { podeIniciar: false, motivo: 'Jogo ja esta sendo iniciado...' };
    if (!sala) return { podeIniciar: false, motivo: 'Sala nao esta aberta' };
    return { podeIniciar: true, motivo: null };
  }, []);

  const validarTrocarPersonagem = useCallback((sel) => {
    if (!sel) return { podeTrocar: true, acao: 'Selecionar personagem' };
    return { podeTrocar: true, acao: 'Trocar personagem' };
  }, []);

  const compartilharSala = async () => {
    try {
      let url = window.location.href;
      url = url.replace('/jogo/', '/convite-jogo/');
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      if (copiarTimeoutRef.current) clearTimeout(copiarTimeoutRef.current);
      copiarTimeoutRef.current = setTimeout(() => setLinkCopiado(false), 2000);
      return true;
    } catch (error) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setLinkCopiado(true);
        if (copiarTimeoutRef.current) clearTimeout(copiarTimeoutRef.current);
        copiarTimeoutRef.current = setTimeout(() => setLinkCopiado(false), 2000);
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  };

  // Computed values
  const infoHistoria = formatarInformacoesHistoria(historia);
  const infoPersonagem = formatarInformacoesPersonagem(personagemSelecionado);
  const participantesFormatados = formatarParticipantes(participantes, user);
  const connectionStatus = getConnectionStatus(socketConnected);
  const validacaoIniciarJogo = validarIniciarJogo(isDonoSala, salaAberta, iniciandoJogo);
  const validacaoTrocarPersonagem = validarTrocarPersonagem(personagemSelecionado);

  // Handlers
  const handleIniciarJogo = async () => {
    if (!onIniciarJogo) return;
    setIniciandoJogo(true);
    try {
      await onIniciarJogo();
    } catch (error) {
      // silenced
    } finally {
      setIniciandoJogo(false);
    }
  };

  const handleTrocarPersonagem = () => {
    onVoltar();
  };

  const handleCompartilharSala = async () => {
    await compartilharSala();
  };

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
          {/* Informacoes da Historia */}
          <div className="lg:col-span-2 space-y-6">
            {/* Historia */}
            <div className="glass p-6 rounded-2xl border border-purple-500/20">
              <h3 className="text-xl font-fantasy font-bold text-white mb-4 flex items-center">
                📖 Historia
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
                    {infoPersonagem.classe} • {infoPersonagem.raca} • Nivel {infoPersonagem.nivel}
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
                    <span>Voce e o Dono desta aventura</span>
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
                    O Dono da sala ira iniciar quando todos estiverem prontos.
                  </p>
                  {!personagemSelecionado && (
                    <p className="text-yellow-300 text-sm mt-2">
                      ⚠️ Voce precisa selecionar um personagem primeiro
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
                          <span className="text-cyan-400 text-xs ml-2">(Voce)</span>
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
                      ⚠️ Conexao perdida. Tentando reconectar automaticamente...
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
