import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vantagemService } from '../../../services/index.js';
import { useVantagemStore } from '../../../store/vantagem';

export const useVantagemEditarModel = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const _jsonToStr = (val) => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  const _arrToStr = (val) => {
    if (!val) return '';
    return Array.isArray(val) ? val.join(', ') : String(val);
  };

  useEffect(() => {
    if (id) loadVantagem(id);
    return () => setError(null);
  }, [id]);

  const loadVantagem = async (vantagemId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vantagemService.getById(vantagemId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setTipo(_arrToStr(data.tipo));
      setElemento(_arrToStr(data.elemento));
      setNivel(data.nivel ?? 1);
      setDanoBase(data.dano_base ?? '');
      setUsar(data.usar ?? '');
      setBonus(_jsonToStr(data.bonus));
      setRestricao(_jsonToStr(data.restricao));
      setEfeito(_jsonToStr(data.efeito));
      setRequisitos(_jsonToStr(data.requisitos));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar vantagem: ${err.message}`);
    }
  };

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

  const saveVantagem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await vantagemService.update(id, _buildData());
      await recarregarVantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar vantagem: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, tipo, elemento, nivel, dano_base, usar,
    bonus, restricao, efeito, requisitos, loading, saving, error,
    setField, saveVantagem, clearError,
  };
};
