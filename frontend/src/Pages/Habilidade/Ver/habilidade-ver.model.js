import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { habilidadeService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

export const useHabilidadeVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [habilidade, setHabilidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await habilidadeService.getById(id);
        setHabilidade(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.HABILIDADES);
  const handleEdit = () => {
    if (habilidade) navigate(generateRoute.editarHabilidade(habilidade.id));
  };
  const clearError = () => setError(null);

  return { habilidade, loading, error, isLight, handleBack, handleEdit, clearError };
};
