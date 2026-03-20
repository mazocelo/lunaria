import { useState, useEffect } from 'react';
import { vantagemService } from '../../../services/index.js';
import { useVantagemStore } from '../../../store/vantagem';

export const useVantagemNovaModel = () => {
  const recarregarVantagens = useVantagemStore(s => s.recarregarVantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState(0);
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [nivel, setNivel] = useState(1);
  const [dano_base, setDanoBase] = useState('');
  const [usar, setUsar] = useState('');
  const [bonus, setBonus] = useState('');
  const [restricao, setRestricao] = useState('');
  const [efeito, setEfeito] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, custo: setCusto, tipo: setTipo,
      elemento: setElemento, nivel: setNivel, dano_base: setDanoBase, usar: setUsar,
      bonus: setBonus, restricao: setRestricao, efeito: setEfeito, requisitos: setRequisitos,
    };
    setters[name]?.(value);
  };

  const _parseJson = (str) => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _parseArr = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const _buildData = () => ({
    nome,
    descricao: descricao || null,
    custo: parseInt(custo) || 0,
    tipo: _parseArr(tipo),
    elemento: _parseArr(elemento),
    nivel: parseInt(nivel) || 1,
    dano_base: dano_base ? parseInt(dano_base) : null,
    usar: usar ? parseInt(usar) : null,
    bonus: _parseJson(bonus),
    restricao: _parseJson(restricao),
    efeito: _parseJson(efeito),
    requisitos: _parseJson(requisitos),
  });

  const criarVantagem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await vantagemService.create(_buildData());
      await recarregarVantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar vantagem: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, tipo, elemento, nivel, dano_base, usar,
    bonus, restricao, efeito, requisitos, saving, error,
    setField, criarVantagem, clearError,
  };
};
