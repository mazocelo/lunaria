import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipamentoService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

export const useEquipamentoVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [equipamento, setEquipamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await equipamentoService.getById(id);
        setEquipamento(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.EQUIPAMENTOS);
  const handleEdit = () => {
    if (equipamento) navigate(generateRoute.editarEquipamento(equipamento.id));
  };
  const clearError = () => setError(null);

  return {
    equipamento,
    loading,
    error,
    isLight,
    handleBack,
    handleEdit,
    clearError,
    navigate,
  };
};
