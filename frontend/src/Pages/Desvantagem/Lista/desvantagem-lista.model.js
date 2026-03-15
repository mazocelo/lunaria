import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { desvantagemService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../constants/routes.js';

export const useDesvantagemListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const loading = useDesvantagemStore(s => s.loading);
  const error = useDesvantagemStore(s => s.error);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);
  const nivelMaisComum = useDesvantagemStore(s => s.nivelMaisComum);
  const tipoMaisComum = useDesvantagemStore(s => s.tipoMaisComum);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!desvantagensCarregadas) carregarDesvantagens();
  }, []);

  const filteredDesvantagens = useMemo(() => {
    if (!searchTerm) return desvantagens;
    const term = searchTerm.toLowerCase();
    return desvantagens.filter(d =>
      d.nome?.toLowerCase().includes(term) ||
      d.descricao?.toLowerCase().includes(term) ||
      (Array.isArray(d.tipo) && d.tipo.some(t => t.toLowerCase().includes(term)))
    );
  }, [desvantagens, searchTerm]);

  const deleteDesvantagem = async (id) => {
    try {
      await desvantagemService.delete(id);
      await recarregarDesvantagens();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover desvantagem: ${err.message}`);
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
    isLight,
    nivelMaisComum,
    tipoMaisComum,
    buscarDesvantagens: setSearchTerm,
    deleteDesvantagem,
    clearError,
    navigate,
    generateRoute,
  };
};
