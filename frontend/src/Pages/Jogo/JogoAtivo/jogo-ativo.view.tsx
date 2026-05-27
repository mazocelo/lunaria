import { Loader2 } from 'lucide-react';
import Notification from '../../../components/Notification';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { EtapaJogoRPG } from '../../../components/Jogo';
import { AuthLoading } from '../../../components/Jogo/Shared/LoadingStates';
import type { JogoAtivoModel } from './jogo-ativo.model';

type JogoAtivoViewProps = JogoAtivoModel;

/**
 * View pura para a pagina de Jogo Ativo.
 * Recebe tudo via props - zero logica.
 */
const JogoAtivoView = ({
  // State
  user,
  historiaAtual,
  personagemSelecionado,
  participantes,
  isDonoSala,
  salaAberta,
  mensagens,
  statusPersonagem,
  error,
  socketError,
  isConnected,
  isReconnecting,

  // Handlers
  handleSair,
  showConfirmSair,
  confirmarSair,
  cancelarSair,
  handleAdicionarMensagem,
  handleAtualizarStatus,
  handleClearErrors,
}: JogoAtivoViewProps) => {
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

  if (!salaAberta) {
    return <AuthLoading />;
  }

  // Renderizacao
  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

      {/* Banner de reconexao */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 backdrop-blur-sm text-white text-center py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
          <Loader2 className="animate-spin" size={16} />
          Reconectando ao servidor...
        </div>
      )}

      {/* P-03: Modal de confirmacao ao sair */}
      <ConfirmationModal
        isOpen={showConfirmSair}
        onClose={cancelarSair}
        onConfirm={confirmarSair}
        title="Sair da Aventura"
        message="Tem certeza que deseja sair? Seus parceiros continuarão jogando."
        confirmText="Sair"
        cancelText="Continuar Jogando"
        type="danger"
      />

      {/* Componente de Jogo Ativo */}
      <EtapaJogoRPG
        historia={historiaAtual}
        personagemSelecionado={personagemSelecionado}
        participantes={participantes}
        mensagens={mensagens}
        statusPersonagem={statusPersonagem}
        isDonoSala={isDonoSala}
        socketConnected={isConnected}
        user={user}
        onAdicionarMensagem={handleAdicionarMensagem}
        onAtualizarStatus={handleAtualizarStatus}
        onSair={handleSair}
      />
    </div>
  );
};

export default JogoAtivoView;
