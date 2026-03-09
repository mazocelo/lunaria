import React from 'react';
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
  isTyping,

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

      {/* Componente de Jogo Ativo */}
      <EtapaJogoRPG
        historia={historiaAtual}
        personagemSelecionado={personagemSelecionado}
        participantes={participantes}
        mensagens={mensagens}
        statusPersonagem={statusPersonagem}
        isDonoSala={isDonoSala}
        socketConnected={isConnected}
        isTyping={isTyping}
        user={user}
        onAdicionarMensagem={handleAdicionarMensagem}
        onAtualizarStatus={handleAtualizarStatus}
        onSair={handleSair}
      />
    </div>
  );
};

export default JogoAtivoView;
