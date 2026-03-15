import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { racaService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const useRacaVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [raca, setRaca] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await racaService.getById(id);
        setRaca(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.RACAS);
  const handleEdit = () => {
    if (raca) navigate(generateRoute.editarRaca(raca.id));
  };
  const clearError = () => setError(null);

  return { raca, loading, error, isLight, handleBack, handleEdit, clearError };
};
