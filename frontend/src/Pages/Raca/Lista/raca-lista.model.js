import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRacaStore } from '../../../store/raca';
import { racaService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useRacaListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const racas = useRacaStore(s => s.racas);
  const loading = useRacaStore(s => s.loading);
  const error = useRacaStore(s => s.error);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const carregarRacas = useRacaStore(s => s.carregarRacas);
  const recarregarRacas = useRacaStore(s => s.recarregarRacas);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!racasCarregadas) carregarRacas();
  }, []);

  const filteredRacas = useMemo(() => {
    if (!searchTerm) return racas;
    const term = searchTerm.toLowerCase();
    return racas.filter(r =>
      r.nome?.toLowerCase().includes(term) ||
      r.descricao?.toLowerCase().includes(term)
    );
  }, [racas, searchTerm]);

  const gratuitas = useMemo(() => (racas || []).filter(r => r.custo === 0).length, [racas]);
  const pagas = useMemo(() => (racas || []).length - gratuitas, [racas, gratuitas]);

  const deleteRaca = async (id) => {
    try {
      await racaService.delete(id);
      await recarregarRacas();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover raca: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    racas,
    filteredRacas,
    loading,
    error: localError || error,
    searchTerm,
    isLight,
    gratuitas,
    pagas,
    buscarRacas: setSearchTerm,
    deleteRaca,
    clearError,
    navigate,
    generateRoute,
  };
};
