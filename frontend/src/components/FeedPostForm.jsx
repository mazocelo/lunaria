import React from 'react';
import { Send, Users, Globe, Loader2 } from 'lucide-react';

const FeedPostForm = ({ text, visibility, creating, onTextChange, onVisibilityChange, onSubmit, isDark }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSubmit();
    }
  };

  return (
    <div className={`mb-6 p-4 rounded-lg border ${
      isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Compartilhe algo com seus amigos..."
        maxLength={2000}
        rows={3}
        className={`w-full resize-none outline-none text-sm ${
          isDark
            ? 'bg-transparent text-white placeholder-gray-500'
            : 'bg-transparent text-gray-900 placeholder-gray-400'
        }`}
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
        {/* Visibilidade */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onVisibilityChange('amigos')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              visibility === 'amigos'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'bg-gray-700 text-gray-400 hover:text-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={12} /> Amigos
          </button>
          <button
            onClick={() => onVisibilityChange('comunidade')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              visibility === 'comunidade'
                ? 'bg-indigo-600 text-white'
                : isDark ? 'bg-gray-700 text-gray-400 hover:text-gray-200' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe size={12} /> Comunidade
          </button>
        </div>

        {/* Enviar */}
        <button
          onClick={onSubmit}
          disabled={!text?.trim() || creating}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Publicar
        </button>
      </div>
    </div>
  );
};

export default FeedPostForm;
