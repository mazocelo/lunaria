import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vantagemService } from '../../../services/index';
import { useVantagemStore } from '../../../store/vantagem';

type VantagemField =
  | 'nome' | 'descricao' | 'custo' | 'tipo' | 'elemento' | 'nivel'
  | 'dano_base' | 'usar' | 'bonus' | 'restricao' | 'efeito' | 'requisitos';

export const useVantagemEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarVantagens = useVantagemStore(s => s.recarregarVantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [nivel, setNivel] = useState<number | string>(1);
  const [dano_base, setDanoBase] = useState<number | string>('');
  const [usar, setUsar] = useState<number | string>('');
  const [bonus, setBonus] = useState('');
  const [restricao, setRestricao] = useState('');
  const [efeito, setEfeito] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _jsonToStr = (val: unknown): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  const _arrToStr = (val: unknown): string => {
    if (!val) return '';
    return Array.isArray(val) ? val.join(', ') : String(val);
  };

  useEffect(() => {
    if (id) loadVantagem(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadVantagem = async (vantagemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vantagemService.getById(Number(vantagemId));
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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar vantagem: ${message}`);
    }
  };

  const setField = (name: VantagemField, value: string | number) => {
    const setters: Record<VantagemField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      custo: setCusto as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      elemento: setElemento as (v: never) => void,
      nivel: setNivel as (v: never) => void,
      dano_base: setDanoBase as (v: never) => void,
      usar: setUsar as (v: never) => void,
      bonus: setBonus as (v: never) => void,
      restricao: setRestricao as (v: never) => void,
      efeito: setEfeito as (v: never) => void,
      requisitos: setRequisitos as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const _parseJson = (str: string): unknown => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _parseArr = (str: string): string[] => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const _buildData = () => ({
    nome,
    descricao: descricao || null,
    custo: parseInt(String(custo)) || 0,
    tipo: _parseArr(tipo),
    elemento: _parseArr(elemento),
    nivel: parseInt(String(nivel)) || 1,
    dano_base: dano_base ? parseInt(String(dano_base)) : null,
    usar: usar ? parseInt(String(usar)) : null,
    bonus: _parseJson(bonus),
    restricao: _parseJson(restricao),
    efeito: _parseJson(efeito),
    requisitos: _parseJson(requisitos),
  });

  const saveVantagem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await vantagemService.update(Number(id), _buildData());
      await recarregarVantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar vantagem: ${message}`);
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
