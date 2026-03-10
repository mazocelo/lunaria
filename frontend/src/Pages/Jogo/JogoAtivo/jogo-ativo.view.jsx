import React from 'react';
import { Loader2 } from 'lucide-react';
import Notification from '../../../components/Notification.jsx';
import { EtapaJogoRPG } from '../../../components/Jogo';
import { AuthLoading } from '../../../components/Jogo/Shared/LoadingStates';

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
  handleAdicionarMensagem,
  handleAtualizarStatus,
  handleClearErrors,
}) => {
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

  if (!salaAberta) {
    return <AuthLoading message="Aguardando sala..." />;
  }

  // Renderizacao
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
