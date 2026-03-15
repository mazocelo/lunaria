import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { desvantagemService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const useDesvantagemVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [desvantagem, setDesvantagem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await desvantagemService.getById(id);
        setDesvantagem(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.DESVANTAGENS);
  const handleEdit = () => {
    if (desvantagem) navigate(generateRoute.editarDesvantagem(desvantagem.id));
  };
  const clearError = () => setError(null);

  return { desvantagem, loading, error, isLight, handleBack, handleEdit, clearError };
};
