import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Loader2, Users, Globe, Zap, Sword, BookOpen, User } from 'lucide-react';
import { feedService } from '../services';
import FeedCommentItem from './FeedCommentItem';

const EVENT_CONFIG = {
  personagem_criado: { icon: User, label: 'Criou um personagem', color: 'text-blue-400' },
  historia_criada: { icon: BookOpen, label: 'Criou uma historia', color: 'text-purple-400' },
  level_up: { icon: Zap, label: 'Subiu de nivel', color: 'text-yellow-400' },
  combate_finalizado: { icon: Sword, label: 'Finalizou um combate', color: 'text-red-400' },
};

const FeedPostCard = ({ post, currentUserId, onLike, onDelete, isDark }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwner = post.usuario?.id === currentUserId;
  const isEvent = post.tipo === 'evento';
  const eventType = post.conteudo?.evento_tipo;
  const eventConfig = eventType ? EVENT_CONFIG[eventType] : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString('pt-BR');
  };

  const renderEventContent = () => {
    const dados = post.conteudo?.evento_dados || {};
    switch (eventType) {
      case 'personagem_criado':
        return `Criou o personagem "${dados.nome}"`;
      case 'historia_criada':
        return `Criou a historia "${dados.nome}"`;
      case 'level_up':
        return `${dados.personagem} subiu para nivel ${dados.nivel}!`;
      case 'combate_finalizado':
        return `Finalizou um combate${dados.resultado ? ` - ${dados.resultado}` : ''}`;
      default:
        return post.conteudo?.texto || '';
    }
  };

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const response = await feedService.fetchComments(post.id);
      setComments(response.data || []);
    } catch {
      // silencioso
    }
    setLoadingComments(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await feedService.addComment(post.id, commentText.trim());
      if (response.data) {
        setComments([...comments, response.data]);
      }
      setCommentText('');
    } catch {
      // silencioso
    }
    setSubmittingComment(false);
  };

  const deleteComment = async (commentId) => {
    try {
      await feedService.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch {
      // silencioso
    }
  };

  const initial = (post.usuario?.nome || '?')[0].toUpperCase();

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        {post.usuario?.avatar ? (
          <img src={post.usuario.avatar} alt={post.usuario.nome} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {post.usuario?.nome}
            </span>
            {isEvent && eventConfig && (
              <span className={`flex items-center gap-1 text-xs ${eventConfig.color}`}>
                <eventConfig.icon size={12} />
                {eventConfig.label}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>{formatDate(post.criado_em)}</span>
            <span className="flex items-center gap-0.5">
              {post.visibilidade === 'amigos' ? <Users size={10} /> : <Globe size={10} />}
              {post.visibilidade === 'amigos' ? 'Amigos' : 'Comunidade'}
            </span>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {isEvent ? renderEventContent() : (post.conteudo?.texto || '')}
        </p>
      </div>

      {/* Footer */}
      <div className={`flex items-center gap-4 px-4 py-2.5 border-t ${
        isDark ? 'border-gray-700/50' : 'border-gray-100'
      }`}>
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.curtidoPorMim
              ? 'text-red-400'
              : isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart size={16} fill={post.curtidoPorMim ? 'currentColor' : 'none'} />
          {post.curtidas > 0 && post.curtidas}
        </button>

        <button
          onClick={loadComments}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isDark ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-500'
          }`}
        >
          <MessageCircle size={16} />
          {post.comentarios > 0 && post.comentarios}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className={`px-4 pb-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <Loader2 size={16} className="animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              <div className="space-y-2 mt-3">
                {comments.map(c => (
                  <FeedCommentItem
                    key={c.id}
                    comment={c}
                    isOwner={c.usuario?.id === currentUserId || c.user_id === currentUserId}
                    onDelete={() => deleteComment(c.id)}
                    isDark={isDark}
                  />
                ))}
              </div>

              {/* Comment input */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="Escreva um comentario..."
                  maxLength={500}
                  className={`flex-1 px-3 py-1.5 rounded text-sm outline-none ${
                    isDark
                      ? 'bg-gray-700 text-white placeholder-gray-500'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40"
                >
                  {submittingComment ? <Loader2 size={12} className="animate-spin" /> : 'Enviar'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(FeedPostCard);
