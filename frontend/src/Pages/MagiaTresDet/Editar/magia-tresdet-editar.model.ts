import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { magiasTresDetService } from '../../../services/index';
import { useMagiasTresDetStore } from '../../../store/magiasTresDet';

type MagiaField =
  | 'nome' | 'descricao' | 'escola' | 'custo_pm' | 'alcance' | 'duracao'
  | 'tipo' | 'exigencias' | 'focus_requisito' | 'efeito' | 'nivel_minimo';

export const useMagiaTresDetEditarModel = () => {
  const { id } = useParams<{ id: string }>();
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
  const [nivel_minimo, setNivelMinimo] = useState<number | string>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _jsonToStr = (val: unknown): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  useEffect(() => {
    if (id) loadMagia(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMagia = async (magiaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await magiasTresDetService.getById(Number(magiaId));
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar magia: ${message}`);
    }
  };

  const setField = (name: MagiaField, value: string | number) => {
    const setters: Record<MagiaField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      escola: setEscola as (v: never) => void,
      custo_pm: setCustoPm as (v: never) => void,
      alcance: setAlcance as (v: never) => void,
      duracao: setDuracao as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      exigencias: setExigencias as (v: never) => void,
      focus_requisito: setFocusRequisito as (v: never) => void,
      efeito: setEfeito as (v: never) => void,
      nivel_minimo: setNivelMinimo as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const _parseJson = (str: string): unknown => {
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
    nivel_minimo: parseInt(String(nivel_minimo)) || 1,
  });

  const saveMagia = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!descricao.trim()) { setError('Descricao e obrigatoria'); return { success: false }; }
    if (!custo_pm.trim()) { setError('Custo PM e obrigatorio'); return { success: false }; }
    if (!duracao.trim()) { setError('Duracao e obrigatoria'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }

    setSaving(true);
    setError(null);
    try {
      await magiasTresDetService.update(Number(id), _buildData());
      await recarregarMagias();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar magia: ${message}`);
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
