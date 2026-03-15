import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vantagemService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../constants/routes.js';

export const useVantagemVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [vantagem, setVantagem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await vantagemService.getById(id);
        setVantagem(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.VANTAGENS);
  const handleEdit = () => {
    if (vantagem) navigate(generateRoute.editarVantagem(vantagem.id));
  };
  const clearError = () => setError(null);

  return { vantagem, loading, error, isLight, handleBack, handleEdit, clearError };
};
