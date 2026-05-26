import { Trash2 } from 'lucide-react';

export interface FeedCommentPayload {
  id?: number | string;
  texto: string;
  criado_em?: string | null;
  usuario?: { id?: number | string; nome?: string | null } | null;
}

interface FeedCommentItemProps {
  comment: FeedCommentPayload;
  isOwner?: boolean;
  onDelete?: () => void;
  isDark?: boolean;
}

const FeedCommentItem = ({ comment, isOwner, onDelete, isDark }: FeedCommentItemProps) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`flex items-start gap-2 py-1.5 group ${
      isDark ? 'text-gray-300' : 'text-gray-700'
    }`}>
      <div className="w-6 h-6 rounded-full bg-indigo-600/50 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
        {(comment.usuario?.nome || '?')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {comment.usuario?.nome}
        </span>
        <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {formatDate(comment.criado_em)}
        </span>
        <p className="text-sm mt-0.5">{comment.texto}</p>
      </div>
      {isOwner && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

export default FeedCommentItem;
