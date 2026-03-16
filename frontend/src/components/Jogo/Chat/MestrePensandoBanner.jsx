import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

const MestrePensandoBanner = ({ ativo, timedOut = false, stale = false, status = null, onAction }) => {
  const mostrar = ativo || timedOut || stale;
  const terminal = status === 'failed' || status === 'timed_out' || timedOut;
  const actionLabel = stale ? 'Verificar status' : (terminal ? 'Gerar novamente' : null);
  const texto = stale
    ? 'Sem atualizacao recente do Mestre'
    : terminal
      ? 'A resposta do Mestre falhou ou expirou'
      : 'O Mestre esta pensando...';

  return (
    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${mostrar ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden min-h-0">
        {mostrar && (
          <div className="mx-2 mb-1.5 animate-slide-up">
            <div className={`game-glass px-4 py-2.5 rounded-xl border relative overflow-hidden ${
              terminal || stale ? 'border-amber-500/40' : 'border-purple-500/40 animate-glow'
            }`}>
              {!terminal && !stale && <div className="absolute inset-0 shimmer pointer-events-none" />}

              <div className="relative flex items-center justify-center gap-3">
                <Sparkles size={18} className={terminal || stale ? 'text-amber-200' : 'text-purple-200'} />

                {!terminal && !stale && (
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gradient-to-t from-purple-500 to-purple-300 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                      />
                    ))}
                  </div>
                )}

                <span className={`${terminal || stale ? 'text-amber-200' : 'text-purple-200'} text-sm font-medium tracking-wide`}>
                  {texto}
                </span>

                {actionLabel && onAction && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/40 hover:bg-purple-500/50 border border-purple-400/50 text-purple-100 text-sm font-medium transition-all hover:scale-105"
                  >
                    <RefreshCw size={14} />
                    {actionLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MestrePensandoBanner;
