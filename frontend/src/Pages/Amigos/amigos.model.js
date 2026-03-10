import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { useAmizadeStore } from '../../store/amizade/index.js';
import { amizadeService } from '../../services';

export const useAmigosModel = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Amizade store
  const friends = useAmizadeStore(s => s.amigos);
  const pending = useAmizadeStore(s => s.pendentes);
  const suggestions = useAmizadeStore(s => s.sugestoes);
  const storeLoading = useAmizadeStore(s => s.loading);
  const storeError = useAmizadeStore(s => s.error);
  const carregarAmigos = useAmizadeStore(s => s.carregarAmigos);
  const carregarPendentes = useAmizadeStore(s => s.carregarPendentes);
  const recarregarAmigos = useAmizadeStore(s => s.recarregarAmigos);
  const recarregarPendentes = useAmizadeStore(s => s.recarregarPendentes);
  const recarregarSugestoes = useAmizadeStore(s => s.recarregarSugestoes);
  const removerAmigoDaLista = useAmizadeStore(s => s.removerAmigoDaLista);
  const removerPendenteDaLista = useAmizadeStore(s => s.removerPendenteDaLista);

  // Local state
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTabState] = useState('amigos');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    carregarAmigos();
    carregarPendentes();
  }, []);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setError(null);
    setSuccessMessage(null);
    if (tab === 'amigos') recarregarAmigos();
    if (tab === 'pendentes') recarregarPendentes();
    if (tab === 'buscar') recarregarSugestoes();
  }, [recarregarAmigos, recarregarPendentes, recarregarSugestoes]);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await amizadeService.searchUsers(query);
      setSearchResults(response.data || []);
    } catch {
      setError('Erro na busca');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    search(searchInput);
    setSearchQuery(searchInput);
  }, [searchInput, search]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      search(searchInput);
      setSearchQuery(searchInput);
    }
  }, [searchInput, search]);

  const sendRequest = useCallback(async (receiverId) => {
    setLoadingAction(receiverId);
    setError(null);
    try {
      await amizadeService.sendRequest(receiverId);
      setLoadingAction(null);
      setSuccessMessage('Solicitacao enviada!');
      if (searchQuery) await search(searchQuery);
      await recarregarSugestoes();
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao enviar solicitacao');
    }
  }, [searchQuery, search, recarregarSugestoes]);

  const acceptRequest = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.acceptRequest(amizadeId);
      setLoadingAction(null);
      setSuccessMessage('Amizade aceita!');
      removerPendenteDaLista(amizadeId);
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao aceitar');
    }
  }, [removerPendenteDaLista]);

  const rejectRequest = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.rejectRequest(amizadeId);
      setLoadingAction(null);
      removerPendenteDaLista(amizadeId);
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao rejeitar');
    }
  }, [removerPendenteDaLista]);

  const removeFriend = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.removeFriend(amizadeId);
      setLoadingAction(null);
      removerAmigoDaLista(amizadeId);
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao remover amigo');
    }
  }, [removerAmigoDaLista]);

  return {
    friends,
    pending,
    suggestions,
    searchResults,
    searchInput,
    activeTab,
    loading: loading || storeLoading,
    loadingAction,
    error: error || storeError,
    successMessage,
    isDark,
    setActiveTab,
    setSearchInput,
    handleSearch,
    handleSearchKeyDown,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    clearMessages,
  };
};
