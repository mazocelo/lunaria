import React from 'react';
import { UserMinus, Check, X, UserPlus, Loader2, Clock } from 'lucide-react';

/**
 * Card reutilizavel para amigo, solicitacao ou resultado de busca
 * @param {Object} usuario - { id, nome, email }
 * @param {string} tipo - amigo | pendente | busca | sugestao
 * @param {string} relacao - null | pendente | aceita | bloqueada (para tipo busca)
 * @param {number} amizadeId
 * @param {string} desde - data de amizade
 * @param {string} criado_em - data da solicitacao
 * @param {boolean} loading
 * @param {Function} onRemove, onAccept, onReject, onAdd
 * @param {boolean} isDark
 */
const AmizadeItem = ({
  usuario,
  tipo,
  relacao,
  amizadeId,
  desde,
  criado_em,
  loading,
  onRemove,
  onAccept,
  onReject,
  onAdd,
  isDark
}) => {
  if (!usuario) return null;

  const initial = (usuario.nome || '?')[0].toUpperCase();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atras`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
      isDark
        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
        : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {usuario.nome}
        </p>
        <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {usuario.email}
        </p>
        {desde && (
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Amigos desde {formatDate(desde)}
          </p>
        )}
        {criado_em && tipo === 'pendente' && (
          <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock size={10} /> {formatDate(criado_em)}
          </p>
        )}
      </div>

      {/* Acoes */}
      <div className="flex items-center gap-2 shrink-0">
        {loading && <Loader2 size={18} className="animate-spin text-indigo-500" />}

        {!loading && tipo === 'amigo' && (
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            title="Remover amigo"
          >
            <UserMinus size={18} />
          </button>
        )}

        {!loading && tipo === 'pendente' && (
          <>
            <button
              onClick={onAccept}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Check size={14} /> Aceitar
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-colors flex items-center gap-1"
            >
              <X size={14} /> Rejeitar
            </button>
          </>
        )}

        {!loading && (tipo === 'busca' || tipo === 'sugestao') && (
          <>
            {relacao === 'aceita' ? (
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                Amigos
              </span>
            ) : relacao === 'pendente' ? (
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-50 text-yellow-600'}`}>
                Pendente
              </span>
            ) : relacao === 'bloqueada' ? (
              <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                Bloqueado
              </span>
            ) : (
              <button
                onClick={onAdd}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
              >
                <UserPlus size={14} /> Adicionar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(AmizadeItem);
