import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { magiasTresDetService } from '../../../services/index.js';
import { useMagiasTresDetStore } from '../../../store/magiasTresDet';

export const useMagiaTresDetEditarModel = () => {
  const { id } = useParams();
  const recarregarMagias = useMagiasTresDetStore(s => s.recarregarMagias);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [escola, setEscola] = useState('branca');
  const [custo_pm, setCustoPm] = useState('');
  const [alcance, setAlcance] = useState('pessoal');
  const [duracao, setDuracao] = useState('');
  const [tipo, setTipo] = useState('dano');
  const [exigencias, setExigencias] = useState('');
  const [focus_requisito, setFocusRequisito] = useState('');
  const [efeito, setEfeito] = useState('');
  const [nivel_minimo, setNivelMinimo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const _jsonToStr = (val) => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  useEffect(() => {
    if (id) loadMagia(id);
    return () => setError(null);
  }, [id]);

  const loadMagia = async (magiaId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await magiasTresDetService.getById(magiaId);
      const data = response.data;

      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setEscola(data.escola || 'branca');
      setCustoPm(data.custo_pm || '');
      setAlcance(data.alcance || 'pessoal');
      setDuracao(data.duracao || '');
      setTipo(data.tipo || 'dano');
      setExigencias(data.exigencias || '');
      setFocusRequisito(_jsonToStr(data.focus_requisito));
      setEfeito(_jsonToStr(data.efeito));
      setNivelMinimo(data.nivel_minimo ?? 1);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar magia: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, escola: setEscola,
      custo_pm: setCustoPm, alcance: setAlcance, duracao: setDuracao,
      tipo: setTipo, exigencias: setExigencias, focus_requisito: setFocusRequisito,
      efeito: setEfeito, nivel_minimo: setNivelMinimo,
    };
    setters[name]?.(value);
  };

  const _parseJson = (str) => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _buildData = () => ({
    nome,
    descricao,
    escola,
    custo_pm,
    alcance,
    duracao,
    tipo: tipo || 'dano',
    exigencias: exigencias || null,
    focus_requisito: _parseJson(focus_requisito),
    efeito: _parseJson(efeito),
    nivel_minimo: parseInt(nivel_minimo) || 1,
  });

  const saveMagia = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!descricao.trim()) { setError('Descricao e obrigatoria'); return { success: false }; }
    if (!custo_pm.trim()) { setError('Custo PM e obrigatorio'); return { success: false }; }
    if (!duracao.trim()) { setError('Duracao e obrigatoria'); return { success: false }; }

    setSaving(true);
    setError(null);
    try {
      await magiasTresDetService.update(id, _buildData());
      await recarregarMagias();
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar magia: ${err.message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, escola, custo_pm, alcance, duracao, tipo,
    exigencias, focus_requisito, efeito, nivel_minimo,
    loading, saving, error,
    setField, saveMagia, clearError,
  };
};
