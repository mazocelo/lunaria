import { useState, useEffect } from 'react';
import { vantagemService } from '../../../services/index';
import { useVantagemStore } from '../../../store/vantagem';

type VantagemField =
  | 'nome' | 'descricao' | 'custo' | 'tipo' | 'elemento' | 'nivel'
  | 'dano_base' | 'usar' | 'bonus' | 'restricao' | 'efeito' | 'requisitos';

export const useVantagemNovaModel = () => {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar vantagem: ${message}`);
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
