import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFeedStore } from '../../store/feed/index';
import { feedService } from '../../services';
import type { FeedPost } from '../../store/feed/states';

type FeedTab = 'amigos' | 'comunidade';
type Visibility = 'amigos' | 'comunidade';

interface FeedPostWithCounts extends FeedPost {
  curtidas?: number;
  curtidoPorMim?: boolean;
}

export const useFeedModel = () => {
  const { user } = useAuth();

  const posts = useFeedStore(s => s.posts) as FeedPostWithCounts[];
  const storeLoading = useFeedStore(s => s.loading);
  const storeError = useFeedStore(s => s.error);
  const hasMore = useFeedStore(s => s.hasMore);
  const carregarFeed = useFeedStore(s => s.carregarFeed);
  const carregarMaisPosts = useFeedStore(s => s.carregarMaisPosts);
  const adicionarPost = useFeedStore(s => s.adicionarPost);
  const removerPost = useFeedStore(s => s.removerPost);
  const atualizarPost = useFeedStore(s => s.atualizarPost);

  const [activeTab, setActiveTabState] = useState<FeedTab>('amigos');
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState<Visibility>('amigos');
  const [creatingPost, setCreatingPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarFeed('amigos');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveTab = useCallback((tab: FeedTab) => {
    setActiveTabState(tab);
    setError(null);
    carregarFeed(tab, true);
  }, [carregarFeed]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await carregarMaisPosts();
    } catch {
      setError('Erro ao carregar mais posts');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, carregarMaisPosts]);

  const createPost = useCallback(async () => {
    const text = newPostText.trim();
    if (!text) return;
    setCreatingPost(true);
    setError(null);
    try {
      const response = await feedService.createPost({
        texto: text,
        visibilidade: newPostVisibility,
      }) as { data?: FeedPost };
      const newPost = response.data;
      setCreatingPost(false);
      setNewPostText('');
      if (newPost) adicionarPost(newPost);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar post';
      setCreatingPost(false);
      setError(message);
    }
  }, [newPostText, newPostVisibility, adicionarPost]);

  const toggleLike = useCallback(async (postId: number | string) => {
    try {
      const response = await feedService.toggleLike(postId) as { data?: { curtido?: boolean } };
      const curtido = response.data?.curtido;
      const post = posts.find(p => p.id === postId);
      if (post) {
        atualizarPost(postId, {
          curtidoPorMim: curtido,
          curtidas: curtido ? (post.curtidas || 0) + 1 : (post.curtidas || 0) - 1,
        });
      }
    } catch {
      // silencioso
    }
  }, [posts, atualizarPost]);

  const deletePost = useCallback(async (postId: number | string) => {
    try {
      await feedService.deletePost(postId);
      removerPost(postId);
    } catch {
      setError('Erro ao deletar post');
    }
  }, [removerPost]);

  return {
    posts,
    activeTab,
    loading: storeLoading,
    loadingMore,
    hasMore,
    newPostText,
    newPostVisibility,
    creatingPost,
    error: error || storeError,
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
