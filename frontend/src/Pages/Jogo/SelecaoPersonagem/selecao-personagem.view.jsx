import React from 'react';
import Notification from '../../../components/Notification.jsx';
import { EtapaSelecaoPersonagem } from '../../../components/Jogo';
import { AuthLoading, AuthError } from '../../../components/Jogo/Shared/LoadingStates';
import HistoriaNotFound from '../../../components/Jogo/Shared/HistoriaNotFound';

/**
 * View pura para a pagina de Selecao de Personagem.
 * Recebe tudo via props - zero logica.
 */
const SelecaoPersonagemView = ({
  // State
  user,
  historiaAtual,
  personagensDaHistoria,
  personagemSelecionado,
  error,
  loading,
  loadingPersonagens,
  errorPersonagens,

  // Handlers
  handleSelecionarPersonagem,
  handleVoltar,
  handleClearErrors,
  handleClearErrorPersonagens,
}) => {
  // Validacoes de acesso (ordem importa!)

  // 1. Verificar autenticacao
  if (!user) {
    return <AuthLoading message="Verificando autenticacao..." />;
  }

  // 2. Mostrar loading se estiver carregando
  if (loading || !historiaAtual) {
    return <AuthLoading message="Carregando historia..." />;
  }

  // 3. Mostrar erro se houver
  if (error) {
    return <AuthError message={error} onRetry={handleClearErrors} />;
  }

  // 4. Se chegou aqui sem historia, entao nao encontrou
  if (!historiaAtual) {
    return <HistoriaNotFound onVoltar={handleVoltar} />;
  }

  // Renderizacao
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Notificacoes de erro */}
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={handleClearErrors}
        />
      )}

      {errorPersonagens && (
        <Notification
          message={`Erro ao carregar personagens: ${errorPersonagens}`}
          type="error"
          onClose={handleClearErrorPersonagens}
        />
      )}

      {/* Componente de Selecao de Personagem */}
      <EtapaSelecaoPersonagem
        historia={historiaAtual}
        personagens={personagensDaHistoria}
        personagemSelecionado={personagemSelecionado}
        loading={loadingPersonagens}
        error={errorPersonagens}
        onSelecionarPersonagem={handleSelecionarPersonagem}
        onVoltar={handleVoltar}
      />
    </div>
  );
};

export default SelecaoPersonagemView;
