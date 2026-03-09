import React, { useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useViewModel } from '../../shared/hooks';
import { feedViewModel } from './viewmodel';
import FeedPostCard from '../../components/FeedPostCard';
import FeedPostForm from '../../components/FeedPostForm';
import { Users, Globe, Loader2, MessageSquare } from 'lucide-react';

const FeedView = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const vm = useViewModel(feedViewModel);
  const isDark = theme === 'dark';

  useEffect(() => {
    feedViewModel.initialize();
  }, []);

  const tabs = [
    { id: 'amigos', label: 'Amigos', icon: Users },
    { id: 'comunidade', label: 'Comunidade', icon: Globe },
  ];

  return (
    <div className={`max-w-2xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Feed</h1>

      {/* Tabs */}
      <div className={`flex gap-1 mb-6 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = vm.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => feedViewModel.setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form de criacao */}
      <FeedPostForm
        text={vm.newPostText}
        visibility={vm.newPostVisibility}
        creating={vm.creatingPost}
        onTextChange={feedViewModel.setNewPostText}
        onVisibilityChange={feedViewModel.setNewPostVisibility}
        onSubmit={feedViewModel.createPost}
        isDark={isDark}
      />

      {/* Erro */}
      {vm.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {vm.error}
        </div>
      )}

      {/* Loading */}
      {vm.loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      )}

      {/* Posts */}
      {!vm.loading && (
        <div className="space-y-4">
          {vm.posts?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum post ainda</p>
              <p className="text-sm mt-1">
                {vm.activeTab === 'amigos'
                  ? 'Adicione amigos e compartilhe suas aventuras!'
                  : 'Seja o primeiro a postar na comunidade!'
                }
              </p>
            </div>
          ) : (
            vm.posts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onLike={() => feedViewModel.toggleLike(post.id)}
                onDelete={() => feedViewModel.deletePost(post.id)}
                isDark={isDark}
              />
            ))
          )}

          {/* Load more */}
          {vm.hasMore && (
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={feedViewModel.loadMore}
                disabled={vm.loadingMore}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {vm.loadingMore ? (
                  <Loader2 className="animate-spin inline mr-2" size={14} />
                ) : null}
                Carregar mais
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedView;
