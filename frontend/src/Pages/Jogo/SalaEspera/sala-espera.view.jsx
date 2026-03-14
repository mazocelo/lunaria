import React from 'react';
import Notification from '../../../components/Notification.jsx';
import ConfirmationModal from '../../../components/ConfirmationModal.jsx';
import { EtapaSalaEspera } from '../../../components/Jogo';
import { AuthLoading, GameTransitionLoading } from '../../../components/Jogo/Shared/LoadingStates';

/**
 * View pura para a pagina de Sala de Espera.
 * Recebe tudo via props - zero logica.
 */
const SalaEsperaView = ({
  // State
  user,
  historiaAtual,
  personagemSelecionado,
  participantes,
  isDonoSala,
  salaAberta,
  error,
  socketError,
  isConnected,
  roomUsers,
  isResumingSession,
  resumeMessage,

  // Handlers
  handleIniciarJogo,
  handleSair,
  handleVoltar,
  handleClearErrors,

  // P-03: Confirmacao ao sair
  showConfirmSair,
  confirmarSair,
  cancelarSair,
}) => {
  // Retomando sessao ativa — tela de transicao tematica
  if (isResumingSession) {
    return <GameTransitionLoading historiaNome={historiaAtual?.nome} message={resumeMessage} />;
  }

  // Validacoes
  if (!user) {
    return <AuthLoading message="Verificando autenticacao..." />;
  }

  if (!historiaAtual) {
    return <AuthLoading message="Carregando historia..." />;
  }

  if (!personagemSelecionado) {
    return <AuthLoading message="Redirecionando..." />;
  }

  // Renderizacao
  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* P-03: Modal de confirmacao ao sair */}
      <ConfirmationModal
        isOpen={showConfirmSair}
        onClose={cancelarSair}
        onConfirm={confirmarSair}
        title="Sair da Sala"
        message="Tem certeza que deseja sair da sala de espera?"
        confirmText="Sair"
        cancelText="Ficar"
        type="danger"
      />

      {/* Notificacoes */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={handleClearErrors}
        />
      )}

      {socketError && (
        <Notification
          message={`Erro de conexao: ${socketError}`}
          type="error"
          onClose={handleClearErrors}
        />
      )}

      {/* Componente de Sala de Espera */}
      <EtapaSalaEspera
        historia={historiaAtual}
        personagemSelecionado={personagemSelecionado}
        participantes={participantes}
        isDonoSala={isDonoSala}
        salaAberta={salaAberta}
        socketConnected={isConnected}
        roomUsers={roomUsers}
        onIniciarJogo={handleIniciarJogo}
        onSair={handleSair}
        onVoltar={handleVoltar}
      />
    </div>
  );
};

export default SalaEsperaView;
