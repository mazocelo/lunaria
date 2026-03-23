import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { itemTresDetService } from '../../../services/index.js';

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
  const { id } = useParams();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [custo_pe, setCustoPe] = useState(0);
  const [preco_moedas, setPrecoMoedas] = useState(0);
  const [poderes, setPoderes] = useState('');
  const [efeito, setEfeito] = useState('');
  const [empilhavel, setEmpilhavel] = useState(false);
  const [raridade, setRaridade] = useState('');
  const [imagem, setImagem] = useState('');
  const [magia_vinculada, setMagiaVinculada] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const _jsonToStr = (val) => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  useEffect(() => {
    if (id) loadItem(id);
    return () => setError(null);
  }, [id]);

  const loadItem = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await itemTresDetService.getById(itemId);
      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setTipo(data.tipo || '');
      setCustoPe(data.custo_pe ?? 0);
      setPrecoMoedas(data.preco_moedas ?? 0);
      setPoderes(_jsonToStr(data.poderes));
      setEfeito(data.efeito || '');
      setEmpilhavel(data.empilhavel ?? false);
      setRaridade(data.raridade || '');
      setImagem(data.imagem || '');
      setMagiaVinculada(data.magia_vinculada || '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar item: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, tipo: setTipo,
      custo_pe: setCustoPe, preco_moedas: setPrecoMoedas,
      poderes: setPoderes, efeito: setEfeito,
      empilhavel: setEmpilhavel, raridade: setRaridade,
      magia_vinculada: setMagiaVinculada,
    };
    setters[name]?.(value);
  };

  const _parseJson = (str) => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _buildData = () => ({
    nome,
    descricao: descricao || null,
    tipo,
    custo_pe: custo_pe ? parseInt(custo_pe) : 0,
    preco_moedas: preco_moedas ? parseInt(preco_moedas) : 0,
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
    setSaving(true);
    setError(null);
    try {
      await itemTresDetService.update(id, _buildData());
      setSaving(false);
      return { success: true };
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar item: ${err.message}`);
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
