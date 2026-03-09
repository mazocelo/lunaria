import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mestreService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { generateRoute } from '../../../routes.jsx';

export const useMestreVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [mestre, setMestre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadMestre(id);
    return () => setError(null);
  }, [id]);

  const loadMestre = async (mestreId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mestreService.getById(mestreId);
      setMestre(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar mestre: ${err.message}`);
    }
  };

  const clearError = () => setError(null);

  return {
    id, mestre, loading, error, isLight,
    clearError, navigate, generateRoute,
  };
};
