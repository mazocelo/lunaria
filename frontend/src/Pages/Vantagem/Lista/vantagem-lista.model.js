import { useState, useEffect, useMemo } from 'react';
import { useVantagemStore } from '../../../store/vantagem';
import { vantagemService } from '../../../services/index.js';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS das vantagens vive aqui.
 */
export const useVantagemListaModel = () => {
  const vantagens = useVantagemStore(s => s.vantagens);
  const loading = useVantagemStore(s => s.loading);
  const error = useVantagemStore(s => s.error);
  const vantagensCarregadas = useVantagemStore(s => s.vantagensCarregadas);
  const carregarVantagens = useVantagemStore(s => s.carregarVantagens);
  const recarregarVantagens = useVantagemStore(s => s.recarregarVantagens);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!vantagensCarregadas) carregarVantagens();
  }, []);

  const filteredVantagens = useMemo(() => {
    if (!searchTerm) return vantagens;
    const term = searchTerm.toLowerCase();
    return vantagens.filter(v =>
      v.nome?.toLowerCase().includes(term) ||
      v.descricao?.toLowerCase().includes(term)
    );
  }, [vantagens, searchTerm]);

  const positivas = useMemo(() => (vantagens || []).filter(v => v.custo > 0).length, [vantagens]);
  const negativas = useMemo(() => (vantagens || []).filter(v => v.custo < 0).length, [vantagens]);

  const deleteVantagem = async (id) => {
    try {
      await vantagemService.delete(id);
      await recarregarVantagens();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover vantagem: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    vantagens,
    filteredVantagens,
    loading,
    error: localError || error,
    searchTerm,
    positivas,
    negativas,
    buscarVantagens: setSearchTerm,
    deleteVantagem,
    clearError,
  };
};
