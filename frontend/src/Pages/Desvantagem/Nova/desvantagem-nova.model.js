import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { desvantagemService } from '../../../services/index.js';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useDesvantagemNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [nivel, setNivel] = useState(1);
  const [usar, setUsar] = useState(0);
  const [dano_base, setDanoBase] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, custo: setCusto,
      tipo: setTipo, elemento: setElemento, nivel: setNivel,
      usar: setUsar, dano_base: setDanoBase
    };
    setters[name]?.(value);
  };

  const criarDesvantagem = async () => {
    if (!nome.trim()) {
      setError('Nome e obrigatorio');
      return { success: false };
    }
    setSaving(true);
    setError(null);
    try {
      const desvantagemData = { nome, descricao, custo, tipo, elemento, nivel, usar, dano_base };
      await desvantagemService.create(desvantagemData);
      await recarregarDesvantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar desvantagem: ${err.message}`);
      return { success: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await criarDesvantagem();
    if (result.success) navigate(ROUTES.DESVANTAGENS);
  };

  const handleCancel = () => navigate(ROUTES.DESVANTAGENS);
  const clearError = () => setError(null);

  return {
    nome, descricao, custo, tipo, elemento, nivel, usar, dano_base,
    saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
