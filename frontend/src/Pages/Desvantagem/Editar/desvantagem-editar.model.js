import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { desvantagemService } from '../../../services/index.js';
import { useDesvantagemStore } from '../../../store/desvantagem';

export const useDesvantagemEditarModel = () => {
  const { id } = useParams();
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [nivel, setNivel] = useState(1);
  const [usar, setUsar] = useState(0);
  const [dano_base, setDanoBase] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) loadDesvantagem(id);
    return () => setError(null);
  }, [id]);

  const loadDesvantagem = async (desvantagemId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await desvantagemService.getById(desvantagemId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setTipo(data.tipo || '');
      setElemento(data.elemento || '');
      setNivel(data.nivel ?? 1);
      setUsar(data.usar ?? 0);
      setDanoBase(data.dano_base || '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar desvantagem: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, custo: setCusto,
      tipo: setTipo, elemento: setElemento, nivel: setNivel,
      usar: setUsar, dano_base: setDanoBase
    };
    setters[name]?.(value);
  };

  const saveDesvantagem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      const desvantagemData = { nome, descricao, custo, tipo, elemento, nivel, usar, dano_base };
      await desvantagemService.update(id, desvantagemData);
      await recarregarDesvantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar desvantagem: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, tipo, elemento, nivel, usar, dano_base,
    loading, saving, error,
    setField, saveDesvantagem, clearError,
  };
};
