import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classeService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

export const useClasseVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [classe, setClasse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await classeService.getById(id);
        setClasse(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleBack = () => navigate(ROUTES.CLASSES);
  const handleEdit = () => {
    if (classe) navigate(generateRoute.editarClasse(classe.id));
  };
  const clearError = () => setError(null);

  return { classe, loading, error, isLight, handleBack, handleEdit, clearError };
};
