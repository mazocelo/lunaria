import Notification from '../../../components/Notification';
import { EtapaSelecaoPersonagem } from '../../../components/Jogo';
import { AuthLoading, AuthError } from '../../../components/Jogo/Shared/LoadingStates';
import HistoriaNotFound from '../../../components/Jogo/Shared/HistoriaNotFound';
import type { SelecaoPersonagemModel } from './selecao-personagem.model';

type SelecaoPersonagemViewProps = SelecaoPersonagemModel;

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
}: SelecaoPersonagemViewProps) => {
  // Validacoes de acesso (ordem importa!)

  // 1. Verificar autenticacao
  if (!user) {
    return <AuthLoading />;
  }

  // 2. Mostrar loading se estiver carregando
  if (loading || !historiaAtual) {
    return <AuthLoading />;
  }

  // 3. Mostrar erro se houver
  if (error) {
    return <AuthError />;
  }

  // 4. Se chegou aqui sem historia, entao nao encontrou
  if (!historiaAtual) {
    return <HistoriaNotFound onVoltarHistorias={handleVoltar} />;
  }

  // Renderizacao
  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
