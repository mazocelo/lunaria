import { useState, useEffect, useCallback } from 'react';
import { useAmizadeStore } from '../../store/amizade/index';
import { amizadeService } from '../../services';
import type { Sugestao } from '../../store/amizade/states';

type AmigosTab = 'amigos' | 'pendentes' | 'buscar';

export const useAmigosModel = () => {
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

  const [searchResults, setSearchResults] = useState<Sugestao[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTabState] = useState<AmigosTab>('amigos');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    carregarAmigos();
    carregarPendentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveTab = useCallback((tab: AmigosTab) => {
    setActiveTabState(tab);
    setError(null);
    setSuccessMessage(null);
    if (tab === 'amigos') recarregarAmigos();
    if (tab === 'pendentes') recarregarPendentes();
    if (tab === 'buscar') recarregarSugestoes();
  }, [recarregarAmigos, recarregarPendentes, recarregarSugestoes]);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await amizadeService.searchUsers(query) as { data?: Sugestao[] };
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

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      search(searchInput);
      setSearchQuery(searchInput);
    }
  }, [searchInput, search]);

  const sendRequest = useCallback(async (receiverId: number) => {
    setLoadingAction(receiverId);
    setError(null);
    try {
      await amizadeService.sendRequest(receiverId);
      setLoadingAction(null);
      setSuccessMessage('Solicitacao enviada!');
      if (searchQuery) await search(searchQuery);
      await recarregarSugestoes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar solicitacao';
      setLoadingAction(null);
      setError(message);
    }
  }, [searchQuery, search, recarregarSugestoes]);

  const acceptRequest = useCallback(async (amizadeId: number) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.acceptRequest(amizadeId);
      setLoadingAction(null);
      setSuccessMessage('Amizade aceita!');
      removerPendenteDaLista(amizadeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aceitar';
      setLoadingAction(null);
      setError(message);
    }
  }, [removerPendenteDaLista]);

  const rejectRequest = useCallback(async (amizadeId: number) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.rejectRequest(amizadeId);
      setLoadingAction(null);
      removerPendenteDaLista(amizadeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao rejeitar';
      setLoadingAction(null);
      setError(message);
    }
  }, [removerPendenteDaLista]);

  const removeFriend = useCallback(async (amizadeId: number) => {
    setLoadingAction(amizadeId);
    setError(null);
    try {
      await amizadeService.removeFriend(amizadeId);
      setLoadingAction(null);
      removerAmigoDaLista(amizadeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover amigo';
      setLoadingAction(null);
      setError(message);
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
