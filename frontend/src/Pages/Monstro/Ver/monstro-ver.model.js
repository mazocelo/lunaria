import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { monstroService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const useMonstroVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [monstro, setMonstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await monstroService.getById(id);
        setMonstro(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => {
    if (monstro) navigate(generateRoute.editarMonstro(monstro.id));
  };
  const clearError = () => setError(null);

  return { monstro, loading, error, isLight, handleBack, handleEdit, clearError };
};
