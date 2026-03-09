import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { amizadeService } from '../../services';

export const useAmigosModel = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
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

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await amizadeService.fetchFriends();
      setFriends(response.data || []);
    } catch {
      setError('Erro ao carregar amigos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await amizadeService.fetchPending();
      setPending(response.data || []);
    } catch {
      setError('Erro ao carregar solicitacoes');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await amizadeService.fetchSuggestions();
      setSuggestions(response.data || []);
    } catch {
      setError('Erro ao carregar sugestoes');
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    // Carrega amigos e pre-carrega pendentes
    loadFriends();
    amizadeService.fetchPending()
      .then(response => setPending(response.data || []))
      .catch(() => { /* silencioso */ });
  }, [loadFriends]);

  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    setError(null);
    setSuccessMessage(null);
    if (tab === 'amigos') loadFriends();
    if (tab === 'pendentes') loadPending();
    if (tab === 'buscar') loadSuggestions();
  }, [loadFriends, loadPending, loadSuggestions]);

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
      const sugResponse = await amizadeService.fetchSuggestions();
      setSuggestions(sugResponse.data || []);
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao enviar solicitacao');
    }
  }, [searchQuery, search]);

  const acceptRequest = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.acceptRequest(amizadeId);
      setLoadingAction(null);
      setSuccessMessage('Amizade aceita!');
      setPending(prev => prev.filter(p => p.id !== amizadeId));
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao aceitar');
    }
  }, []);

  const rejectRequest = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.rejectRequest(amizadeId);
      setLoadingAction(null);
      setPending(prev => prev.filter(p => p.id !== amizadeId));
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao rejeitar');
    }
  }, []);

  const removeFriend = useCallback(async (amizadeId) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.removeFriend(amizadeId);
      setLoadingAction(null);
      setFriends(prev => prev.filter(f => f.amizadeId !== amizadeId));
    } catch (err) {
      setLoadingAction(null);
      setError(err.message || 'Erro ao remover amigo');
    }
  }, []);

  return {
    friends,
    pending,
    suggestions,
    searchResults,
    searchInput,
    activeTab,
    loading,
    loadingAction,
    error,
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
