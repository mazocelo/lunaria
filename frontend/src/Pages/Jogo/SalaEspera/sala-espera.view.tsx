import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { EtapaSalaEspera } from '../../../components/Jogo';
import { AuthLoading, GameTransitionLoading } from '../../../components/Jogo/Shared/LoadingStates';
import type { SalaEsperaModel } from './sala-espera.model';

type SalaEsperaViewProps = SalaEsperaModel;

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
}: SalaEsperaViewProps) => {
  // Retomando sessao ativa — tela de transicao tematica
  if (isResumingSession) {
    return <GameTransitionLoading historiaNome={String(historiaAtual?.nome ?? '')} message={resumeMessage} />;
  }

  // Validacoes
  if (!user) {
    return <AuthLoading />;
  }

  if (!historiaAtual) {
    return <AuthLoading />;
  }

  if (!personagemSelecionado) {
    return <AuthLoading />;
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
