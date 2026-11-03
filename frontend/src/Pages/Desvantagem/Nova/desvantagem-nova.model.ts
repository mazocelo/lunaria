import { useState, useEffect } from 'react';
import { desvantagemService } from '../../../services/index';
import { useDesvantagemStore } from '../../../store/desvantagem';

type DesvantagemField =
  | 'nome' | 'descricao' | 'custo' | 'tipo' | 'elemento'
  | 'nivel' | 'usar' | 'dano_base';

export const useDesvantagemNovaModel = () => {
  const recarregarDesvantagens = useDesvantagemStore(s => s.recarregarDesvantagens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo, setCusto] = useState<number | string>(0);
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [nivel, setNivel] = useState<number | string>(1);
  const [usar, setUsar] = useState<number | string>(0);
  const [dano_base, setDanoBase] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

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
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar desvantagem: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo, tipo, elemento, nivel, usar, dano_base,
    saving, error,
    setField, criarDesvantagem, clearError,
  };
};
