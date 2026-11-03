import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { itemTresDetService } from '../../../services/index';

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

export const useItemTresDetEditarModel = () => {
  const { id } = useParams<{ id: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [custo_pe, setCustoPe] = useState<number | string>(0);
  const [preco_moedas, setPrecoMoedas] = useState<number | string>(0);
  const [poderes, setPoderes] = useState('');
  const [efeito, setEfeito] = useState('');
  const [empilhavel, setEmpilhavel] = useState(false);
  const [raridade, setRaridade] = useState('');
  const [imagem, setImagem] = useState('');
  const [magia_vinculada, setMagiaVinculada] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _jsonToStr = (val: unknown): string => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  useEffect(() => {
    if (id) loadItem(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadItem = async (itemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await itemTresDetService.getById(Number(itemId));
      const d = data as Record<string, unknown>;
      setNome((d.nome as string) || '');
      setDescricao((d.descricao as string) || '');
      setTipo((d.tipo as string) || '');
      setCustoPe((d.custo_pe as number) ?? 0);
      setPrecoMoedas((d.preco_moedas as number) ?? 0);
      setPoderes(_jsonToStr(d.poderes));
      setEfeito((d.efeito as string) || '');
      setEmpilhavel((d.empilhavel as boolean) ?? false);
      setRaridade((d.raridade as string) || '');
      setImagem((d.imagem as string) || '');
      setMagiaVinculada((d.magia_vinculada as string) || '');
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar item: ${message}`);
    }
  };

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
    ...(imagem ? { imagem } : {}),
  });

  const saveItem = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!tipo) { setError('Tipo e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await itemTresDetService.update(Number(id), _buildData());
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar item: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, tipo, custo_pe, preco_moedas,
    poderes, efeito, empilhavel, raridade, magia_vinculada,
    tiposOptions: TIPOS_OPTIONS,
    raridadeOptions: RARIDADE_OPTIONS,
    imagem, setImagem,
    loading, saving, error,
    setField, saveItem, clearError,
  };
};
