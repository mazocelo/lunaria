import { useState } from 'react';
import { itemTresDetService } from '../../../services/index';
import { useItemTresDetStore } from '../../../store/itemTresDet/index';

type ItemField =
  | 'nome' | 'descricao' | 'tipo' | 'custo_pe' | 'preco_moedas'
  | 'poderes' | 'efeito' | 'empilhavel' | 'raridade' | 'magia_vinculada';

const TIPOS_OPTIONS = [
  { value: 'arma', label: 'Arma' },
  { value: 'armadura', label: 'Armadura' },
  { value: 'acessorio', label: 'Acessorio' },
  { value: 'consumivel', label: 'Consumivel' },
  { value: 'pergaminho', label: 'Pergaminho' },
  { value: 'mecha', label: 'Mecha' },
];

const RARIDADE_OPTIONS = [
  { value: 'comum', label: 'Comum' },
  { value: 'incomum', label: 'Incomum' },
  { value: 'raro', label: 'Raro' },
  { value: 'lendario', label: 'Lendario' },
  { value: 'variavel', label: 'Variavel' },
];

export const useItemTresDetNovaModel = () => {
  const recarregarItens = useItemTresDetStore(s => s.recarregarItens);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [custo_pe, setCustoPe] = useState<number | string>(0);
  const [preco_moedas, setPrecoMoedas] = useState<number | string>(0);
  const [poderes, setPoderes] = useState('');
  const [efeito, setEfeito] = useState('');
  const [empilhavel, setEmpilhavel] = useState(false);
  const [raridade, setRaridade] = useState('');
  const [magia_vinculada, setMagiaVinculada] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (name: ItemField, value: string | number | boolean) => {
    const setters: Record<ItemField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      custo_pe: setCustoPe as (v: never) => void,
      preco_moedas: setPrecoMoedas as (v: never) => void,
      poderes: setPoderes as (v: never) => void,
      efeito: setEfeito as (v: never) => void,
      empilhavel: setEmpilhavel as (v: never) => void,
      raridade: setRaridade as (v: never) => void,
      magia_vinculada: setMagiaVinculada as (v: never) => void,
    };
    setters[name]?.(value as never);
  };

  const _parseJson = (str: string): unknown => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _buildData = () => ({
    nome,
    descricao: descricao || null,
    tipo,
    custo_pe: custo_pe ? parseInt(String(custo_pe)) : 0,
    preco_moedas: preco_moedas ? parseInt(String(preco_moedas)) : 0,
    poderes: _parseJson(poderes),
    efeito: efeito || null,
    empilhavel,
    raridade: raridade || null,
    magia_vinculada: magia_vinculada || null,
  });

  const criarItem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!tipo) { setError('Tipo e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await itemTresDetService.create(_buildData());
      await recarregarItens();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar item: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, tipo, custo_pe, preco_moedas,
    poderes, efeito, empilhavel, raridade, magia_vinculada,
    tiposOptions: TIPOS_OPTIONS,
    raridadeOptions: RARIDADE_OPTIONS,
    saving, error,
    setField, criarItem, clearError,
  };
};
