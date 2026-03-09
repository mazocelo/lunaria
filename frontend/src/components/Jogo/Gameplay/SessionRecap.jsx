import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Overlay de recap ao final da sessao
 * Mostra resumo IA, XP ganho, loot obtido
 */
const SessionRecap = ({ isVisible, recapData, onClose }) => {
  const [fase, setFase] = useState(0); // 0=hidden, 1=fade-in, 2=content
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVisible) {
      setFase(0);
      return;
    }
    setFase(1);
    const t1 = setTimeout(() => setFase(2), 300);
    return () => clearTimeout(t1);
  }, [isVisible]);

  if (!isVisible && fase === 0) return null;

  const { resumo, historiaNome, xpGanho, loot } = recapData || {};

  const handleVoltar = () => {
    onClose?.();
    navigate('/historias');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        fase === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Content */}
      <div className={`relative z-10 max-w-2xl w-full mx-4 transition-all duration-500 ${
        fase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="glass rounded-2xl border border-purple-500/30 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 px-6 py-4 border-b border-purple-500/20">
            <h2 className="text-2xl font-fantasy font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
              Sessao Encerrada
            </h2>
            {historiaNome && (
              <p className="text-purple-300/70 text-sm font-modern mt-1">{historiaNome}</p>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Resumo IA */}
            {resumo && (
              <div>
                <h3 className="text-sm font-modern font-semibold text-purple-400 uppercase tracking-wide mb-2">
                  Resumo da Aventura
                </h3>
                <p className="text-slate-200 font-modern text-sm leading-relaxed whitespace-pre-line">
                  {resumo}
                </p>
              </div>
            )}

            {/* XP Ganho */}
            {xpGanho > 0 && (
              <div className="glass px-4 py-3 rounded-lg border border-yellow-500/30">
                <span className="text-yellow-400 font-modern font-semibold">
                  +{xpGanho} XP ganho nesta sessao
                </span>
              </div>
            )}

            {/* Loot */}
            {loot && loot.length > 0 && (
              <div>
                <h3 className="text-sm font-modern font-semibold text-green-400 uppercase tracking-wide mb-2">
                  Itens Obtidos
                </h3>
                <div className="space-y-1">
                  {loot.map((item, i) => (
                    <div key={i} className="glass px-3 py-2 rounded border border-green-500/20 flex items-center gap-2">
                      <span className="text-green-400 text-sm">
                        {item.nome || item.itemNome || 'Item'}
                      </span>
                      {item.quantidade > 1 && (
                        <span className="text-slate-400 text-xs">x{item.quantidade}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sem resumo disponivel */}
            {!resumo && !xpGanho && (!loot || loot.length === 0) && (
              <p className="text-slate-400 font-modern text-sm text-center py-4">
                A sessao foi encerrada. Obrigado por jogar!
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-purple-500/20 flex justify-center">
            <button
              onClick={handleVoltar}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-modern font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/20"
            >
              Voltar as Historias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecap;
