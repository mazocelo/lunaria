import React, { type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface RouteErrorBoundaryProps {
  children?: ReactNode;
  fallback?: (error: Error | null, retry: () => void) => ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundaryInner extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RouteErrorBoundary] Erro na rota:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const retry = () => this.setState({ hasError: false, error: null });
      return this.props.fallback
        ? this.props.fallback(this.state.error, retry)
        : <DefaultFallback onRetry={retry} />;
    }
    return this.props.children;
  }
}

interface DefaultFallbackProps {
  onRetry: () => void;
}

function DefaultFallback({ onRetry }: DefaultFallbackProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] p-8">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle size={48} className="mx-auto text-yellow-400" />
        <h2 className="text-xl font-bold text-purple-200">Erro nesta pagina</h2>
        <p className="text-purple-300/70 text-sm">
          Algo deu errado ao carregar esta pagina. O resto da aplicacao continua funcionando.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            <Home size={14} />
            Ir para inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default RouteErrorBoundaryInner;
