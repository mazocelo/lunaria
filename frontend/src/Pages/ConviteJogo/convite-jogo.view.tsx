import LoadingSpinner from '../../components/LoadingSpinner';
import Notification from '../../components/Notification';
import type { UsuarioPayload } from '../../services/AuthService';

interface HistoriaConvite {
  id?: number;
  nome?: string;
  titulo?: string;
  descricao?: string | null;
}

interface ConviteJogoViewProps {
  user: UsuarioPayload | null | undefined;
  historia: HistoriaConvite | null;
  error: string | null;
  redirecting: boolean;
  handleRetry: () => void;
  handleGoToHistorias: () => void;
}

const ConviteJogoView = ({
  user,
  historia,
  error,
  redirecting,
  handleRetry,
  handleGoToHistorias,
}: ConviteJogoViewProps) => {
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass p-8 rounded-2xl border border-purple-500/20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-fantasy font-bold text-white mb-2">
            Verificando Autenticacao
          </h2>
          <p className="text-purple-300">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="glass p-8 rounded-2xl border border-red-500/20 text-center max-w-md w-full">
          <div className="text-6xl mb-4">X</div>
          <h2 className="text-xl font-fantasy font-bold text-white mb-4">
            Convite Invalido
          </h2>
          <p className="text-red-300 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full btn-rpg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleGoToHistorias}
              className="w-full btn-rpg-secondary"
            >
              Ver Outras Historias
            </button>
          </div>
        </div>

        <Notification
          message={`Erro no convite: ${error}`}
          type="error"
          onClose={() => {}}
        />
      </div>
    );
  }

  const nomeUsuario = (user.nome as string) || (user.name as string) || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 glass p-8 rounded-2xl border border-purple-500/20 text-center max-w-md w-full">
        {!redirecting ? (
          <>
            <div className="mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h2 className="text-2xl font-fantasy font-bold text-white mb-4">
              Processando Convite
            </h2>
            <p className="text-purple-300 mb-4">
              Carregando informacoes da aventura...
            </p>

            {historia && (
              <div className="glass p-4 rounded-lg border border-cyan-500/20 mb-4">
                <h3 className="text-lg font-bold text-white mb-2">
                  {historia.nome || historia.titulo}
                </h3>
                <p className="text-cyan-300 text-sm">
                  {historia.descricao?.substring(0, 100)}
                  {(historia.descricao?.length || 0) > 100 ? '...' : ''}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">OK</span>
              </div>
            </div>
            <h2 className="text-2xl font-fantasy font-bold text-white mb-4">
              Redirecionando
            </h2>
            <p className="text-green-300 mb-4">
              Convite aceito! Entrando na aventura...
            </p>

            {historia && (
              <div className="glass p-4 rounded-lg border border-green-500/20">
                <h3 className="text-lg font-bold text-white mb-2">
                  {historia.nome || historia.titulo}
                </h3>
                <p className="text-green-300 text-sm">
                  Preparando selecao de personagem...
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-6 pt-4 border-t border-purple-500/20">
          <p className="text-purple-400 text-sm">
            Conectado como: <span className="text-white font-semibold">{nomeUsuario}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConviteJogoView;
