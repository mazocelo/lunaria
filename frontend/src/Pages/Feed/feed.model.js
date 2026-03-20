import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useFeedStore } from '../../store/feed/index.js';
import { feedService } from '../../services';

export const useFeedModel = () => {
  const { user } = useAuth();

  // Feed store
  const posts = useFeedStore(s => s.posts);
  const storeLoading = useFeedStore(s => s.loading);
  const storeError = useFeedStore(s => s.error);
  const hasMore = useFeedStore(s => s.hasMore);
  const carregarFeed = useFeedStore(s => s.carregarFeed);
  const carregarMaisPosts = useFeedStore(s => s.carregarMaisPosts);
  const adicionarPost = useFeedStore(s => s.adicionarPost);
  const removerPost = useFeedStore(s => s.removerPost);
  const atualizarPost = useFeedStore(s => s.atualizarPost);

  // Local state
  const [activeTab, setActiveTabState] = useState('amigos');
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostVisibility, setNewPostVisibility] = useState('amigos');
  const [creatingPost, setCreatingPost] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarFeed('amigos');
  }, []);

  const setActiveTab = useCallback((tab) => {
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
      });
      const newPost = response.data;
      setCreatingPost(false);
      setNewPostText('');
      adicionarPost(newPost);
    } catch (err) {
      setCreatingPost(false);
      setError(err.message || 'Erro ao criar post');
    }
  }, [newPostText, newPostVisibility, adicionarPost]);

  const toggleLike = useCallback(async (postId) => {
    try {
      const response = await feedService.toggleLike(postId);
      const curtido = response.data?.curtido;
      const post = posts.find(p => p.id === postId);
      if (post) {
        atualizarPost(postId, {
          curtidoPorMim: curtido,
          curtidas: curtido ? post.curtidas + 1 : post.curtidas - 1,
        });
      }
    } catch {
      // silencioso
    }
  }, [posts, atualizarPost]);

  const deletePost = useCallback(async (postId) => {
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
