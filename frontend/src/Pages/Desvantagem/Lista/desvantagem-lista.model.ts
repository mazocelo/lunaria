import { useState, useEffect, useMemo } from 'react';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { desvantagemService } from '../../../services/index';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS das desvantagens vive aqui.
 */
export const useDesvantagemListaModel = () => {
  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const loading = useDesvantagemStore(s => s.loading);
  const error = useDesvantagemStore(s => s.error);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);
  const nivelMaisComum = useDesvantagemStore(s => s.nivelMaisComum);
  const tipoMaisComum = useDesvantagemStore(s => s.tipoMaisComum);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!desvantagensCarregadas) carregarDesvantagens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDesvantagens = useMemo(() => {
    if (!searchTerm) return desvantagens;
    const term = searchTerm.toLowerCase();
    return desvantagens.filter((d) =>
      d.nome?.toLowerCase().includes(term) ||
      d.descricao?.toLowerCase().includes(term) ||
      (Array.isArray(d.tipo) && d.tipo.some((t) => t.toLowerCase().includes(term))),
    );
  }, [desvantagens, searchTerm]);

  const deleteDesvantagem = async (id: number | string) => {
    try {
      await desvantagemService.delete(Number(id));
      await recarregarDesvantagens();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLocalError(`Erro ao remover desvantagem: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    desvantagens,
    filteredDesvantagens,
    loading,
    error: localError || error,
    searchTerm,
    nivelMaisComum,
    tipoMaisComum,
    buscarDesvantagens: setSearchTerm,
    deleteDesvantagem,
    clearError,
  };
};
