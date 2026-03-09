import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { feedService } from '../../services';

export const useFeedModel = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTabState] = useState('amigos');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [newPostText, setNewPostText] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState('amigos');
  const [creatingPost, setCreatingPost] = useState(false);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async (tab) => {
    setLoading(true);
    setError(null);
    try {
      const response = await feedService.fetchFeed(tab, { limit: 20, offset: 0 });
      setPosts(response.data || []);
      setHasMore(response.pagination?.hasMore || false);
      setOffset(20);
    } catch {
      setError('Erro ao carregar feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed('amigos');
  }, [loadFeed]);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setPosts([]);
    setOffset(0);
    setHasMore(false);
    setError(null);
    loadFeed(tab);
  }, [loadFeed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await feedService.fetchFeed(activeTab, { limit: 20, offset });
      const newPosts = response.data || [];
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(response.pagination?.hasMore || false);
      setOffset(prev => prev + 20);
    } catch {
      setError('Erro ao carregar mais posts');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeTab, offset]);

  const createPost = useCallback(async () => {
    const text = newPostText.trim();
    if (!text) return;
    setCreatingPost(true);
    setError(null);
    try {
      const response = await feedService.createPost({
        texto: text,
        visibilidade: newPostVisibility,
      });
      const newPost = response.data;
      setCreatingPost(false);
      setNewPostText('');
      if (newPost) setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setCreatingPost(false);
      setError(err.message || 'Erro ao criar post');
    }
  }, [newPostText, newPostVisibility]);

  const toggleLike = useCallback(async (postId) => {
    try {
      const response = await feedService.toggleLike(postId);
      const curtido = response.data?.curtido;
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          curtidoPorMim: curtido,
          curtidas: curtido ? p.curtidas + 1 : p.curtidas - 1,
        };
      }));
    } catch {
      // silencioso
    }
  }, []);

  const deletePost = useCallback(async (postId) => {
    try {
      await feedService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      setError('Erro ao deletar post');
    }
  }, []);

  return {
    posts,
    activeTab,
    loading,
    loadingMore,
    hasMore,
    newPostText,
    newPostVisibility,
    creatingPost,
    error,
    isDark,
    currentUserId: user?.id,
    setActiveTab,
    setNewPostText,
    setNewPostVisibility,
    createPost,
    loadMore,
    toggleLike,
    deletePost,
  };
};
