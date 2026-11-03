import { useState, useEffect } from 'react';
import { magiasTresDetService } from '../../../services/index';
import { useMagiasTresDetStore } from '../../../store/magiasTresDet';

type MagiaField =
  | 'nome' | 'descricao' | 'escola' | 'custo_pm' | 'alcance' | 'duracao'
  | 'tipo' | 'exigencias' | 'focus_requisito' | 'efeito' | 'nivel_minimo';

export const useMagiaTresDetNovaModel = () => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

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

  const criarMagia = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!descricao.trim()) { setError('Descricao e obrigatoria'); return { success: false }; }
    if (!custo_pm.trim()) { setError('Custo PM e obrigatorio'); return { success: false }; }
    if (!duracao.trim()) { setError('Duracao e obrigatoria'); return { success: false }; }

    setSaving(true);
    setError(null);
    try {
      await magiasTresDetService.create(_buildData());
      await recarregarMagias();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar magia: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, escola, custo_pm, alcance, duracao, tipo,
    exigencias, focus_requisito, efeito, nivel_minimo,
    saving, error,
    setField, criarMagia, clearError,
  };
};
