import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { desvantagemService } from '../../../services/index';
import { useDesvantagemStore } from '../../../store/desvantagem';

type DesvantagemField =
  | 'nome' | 'descricao' | 'custo' | 'tipo' | 'elemento'
  | 'nivel' | 'usar' | 'dano_base';

export const useDesvantagemEditarModel = () => {
  const { id } = useParams<{ id: string }>();
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [tipo, setTipo] = useState<string | string[]>('');
  const [elemento, setElemento] = useState<string | string[]>('');
  const [nivel, setNivel] = useState<number | string>(1);
  const [usar, setUsar] = useState<number | string>(0);
  const [dano_base, setDanoBase] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadDesvantagem(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDesvantagem = async (desvantagemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await desvantagemService.getById(Number(desvantagemId));
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCusto(data.custo ?? 0);
      setTipo((data.tipo as string | string[]) || '');
      setElemento((data.elemento as string | string[]) || '');
      setNivel(data.nivel ?? 1);
      setUsar(data.usar ?? 0);
      setDanoBase(data.dano_base || '');
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar desvantagem: ${message}`);
    }
  };

  const setField = (name: DesvantagemField, value: string | number) => {
    const setters: Record<DesvantagemField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      custo: setCusto as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      elemento: setElemento as (v: never) => void,
      nivel: setNivel as (v: never) => void,
      usar: setUsar as (v: never) => void,
      dano_base: setDanoBase as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const saveDesvantagem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      const desvantagemData = { nome, descricao, custo, tipo, elemento, nivel, usar, dano_base };
      await desvantagemService.update(Number(id), desvantagemData);
      await recarregarDesvantagens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar desvantagem: ${message}`);
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
