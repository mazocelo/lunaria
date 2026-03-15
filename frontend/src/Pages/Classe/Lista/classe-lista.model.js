import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClasseStore } from '../../../store/classe';
import { classeService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../constants/routes.js';

export const useClasseListaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const classes = useClasseStore(s => s.classes);
  const loading = useClasseStore(s => s.loading);
  const error = useClasseStore(s => s.error);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const carregarClasses = useClasseStore(s => s.carregarClasses);
  const recarregarClasses = useClasseStore(s => s.recarregarClasses);

  const [searchTerm, setSearchTerm] = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!classesCarregadas) carregarClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return classes;
    const term = searchTerm.toLowerCase();
    return classes.filter(c =>
      c.nome?.toLowerCase().includes(term) ||
      c.descricao?.toLowerCase().includes(term)
    );
  }, [classes, searchTerm]);

  const gratuitas = useMemo(() => (classes || []).filter(c => c.custo === 0).length, [classes]);
  const pagas = useMemo(() => (classes || []).length - gratuitas, [classes, gratuitas]);

  const deleteClasse = async (id) => {
    try {
      await classeService.delete(id);
      await recarregarClasses();
      return { success: true };
    } catch (err) {
      setLocalError(`Erro ao remover classe: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setLocalError(null);

  return {
    classes,
    filteredClasses,
    loading,
    error: localError || error,
    searchTerm,
    isLight,
    gratuitas,
    pagas,
    buscarClasses: setSearchTerm,
    deleteClasse,
    clearError,
    navigate,
    generateRoute,
  };
};
