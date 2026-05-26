import FeedPostCard from '../../components/FeedPostCard';
import FeedPostForm from '../../components/FeedPostForm';
import { TableSkeleton } from '../../components/shared';
import { Users, Globe, Loader2, MessageSquare } from 'lucide-react';
import { useTheme } from '../../contexts/theme';
import type { ComponentType } from 'react';
import type { FeedPost } from '../../store/feed/states';

type FeedTab = 'amigos' | 'comunidade';

interface TabConfig {
  id: FeedTab;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const TABS: TabConfig[] = [
  { id: 'amigos', label: 'Amigos', icon: Users },
  { id: 'comunidade', label: 'Comunidade', icon: Globe },
];

interface FeedViewProps {
  posts: FeedPost[];
  activeTab: FeedTab;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  newPostText: string;
  newPostVisibility: 'amigos' | 'comunidade';
  creatingPost: boolean;
  error: string | null;
  currentUserId: number | string | undefined;
  setActiveTab: (tab: FeedTab) => void;
  setNewPostText: (text: string) => void;
  setNewPostVisibility: (visibility: 'amigos' | 'comunidade') => void;
  createPost: () => void;
  loadMore: () => void;
  toggleLike: (id: number | string) => void;
  deletePost: (id: number | string) => void;
}

const FeedView = ({
  posts,
  activeTab,
  loading,
  loadingMore,
  hasMore,
  newPostText,
  newPostVisibility,
  creatingPost,
  error,
  currentUserId,
  setActiveTab,
  setNewPostText,
  setNewPostVisibility,
  createPost,
  loadMore,
  toggleLike,
  deletePost,
}: FeedViewProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`max-w-2xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Feed</h1>

      <div className={`flex gap-1 mb-6 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      <FeedPostForm
        text={newPostText}
        visibility={newPostVisibility}
        creating={creatingPost}
        onTextChange={setNewPostText}
        onVisibilityChange={setNewPostVisibility}
        onSubmit={createPost}
        isDark={isDark}
      />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && <TableSkeleton rows={3} cols={3} />}

      {!loading && (
        <div className="space-y-4">
          {posts?.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum post ainda</p>
              <p className="text-sm mt-1">
                {activeTab === 'amigos'
                  ? 'Adicione amigos e compartilhe suas aventuras!'
                  : 'Seja o primeiro a postar na comunidade!'
                }
              </p>
            </div>
          ) : (
            posts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onLike={() => toggleLike(post.id)}
                onDelete={() => deletePost(post.id)}
                isDark={isDark}
              />
            ))
          )}

          {hasMore && (
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {loadingMore ? (
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
