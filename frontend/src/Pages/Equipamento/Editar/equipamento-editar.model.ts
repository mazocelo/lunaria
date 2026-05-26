import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { equipamentoService, catalogoService } from '../../../services/index';
import type { EquipamentoRel } from '../Lista/equipamento-lista.model';

type EquipField =
  | 'nome' | 'descricao' | 'tipo' | 'elemento' | 'bonus' | 'dano_base' | 'requisitos'
  | 'numero' | 'raridade_id' | 'origem_lore' | 'categoria_id'
  | 'vinculo_requer' | 'vinculo_restricao_tipo' | 'vinculo_restricao' | 'vinculo_descricao'
  | 'propriedades' | 'cargas' | 'usos_por_dia';

interface VinculoRaw {
  requer?: boolean;
  restricao_tipo?: string;
  restricao?: string[] | string;
  descricao?: string;
}

export const useEquipamentoEditarModel = () => {
  const { id } = useParams<{ id: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [bonus, setBonus] = useState('');
  const [dano_base, setDanoBase] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [numero, setNumero] = useState<number | string>('');
  const [raridade_id, setRaridadeId] = useState<number | string>('');
  const [origem_lore, setOrigemLore] = useState('');
  const [categoria_id, setCategoriaId] = useState<number | string>('');
  const [vinculo_requer, setVinculoRequer] = useState(false);
  const [vinculo_restricao_tipo, setVinculoRestricaoTipo] = useState('');
  const [vinculo_restricao, setVinculoRestricao] = useState('');
  const [vinculo_descricao, setVinculoDescricao] = useState('');
  const [propriedades, setPropriedades] = useState('');
  const [cargas, setCargas] = useState<number | string>('');
  const [usos_por_dia, setUsosPorDia] = useState<number | string>('');
  const [raridades, setRaridades] = useState<EquipamentoRel[]>([]);
  const [categorias, setCategorias] = useState<EquipamentoRel[]>([]);
  const [imagem, setImagem] = useState<string>('');
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

  const _loadVinculo = (vinculo: VinculoRaw | null | undefined) => {
    if (!vinculo) return { vinculo_requer: false, vinculo_restricao_tipo: '', vinculo_restricao: '', vinculo_descricao: '' };
    return {
      vinculo_requer: vinculo.requer || false,
      vinculo_restricao_tipo: vinculo.restricao_tipo || '',
      vinculo_restricao: Array.isArray(vinculo.restricao) ? vinculo.restricao.join(', ') : '',
      vinculo_descricao: vinculo.descricao || '',
    };
  };

  useEffect(() => {
    if (id) loadEquipamento(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEquipamento = async (equipId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasEquipamento(),
      ]);
      setRaridades(((rarRes as { data?: EquipamentoRel[] }).data) || []);
      setCategorias(((catRes as { data?: EquipamentoRel[] }).data) || []);

      const { data } = await equipamentoService.getById(Number(equipId));
      const d = data as Record<string, unknown>;
      const vinculoData = _loadVinculo(d.vinculo as VinculoRaw | null | undefined);

      setNome((d.nome as string) || '');
      setDescricao((d.descricao as string) || '');
      setTipo(_arrToStr(d.tipo));
      setElemento(_arrToStr(d.elemento));
      setBonus(_jsonToStr(d.bonus));
      setDanoBase((d.dano_base as string) ?? '');
      setRequisitos(_jsonToStr(d.requisitos));
      setNumero((d.numero as number | string) ?? '');
      setRaridadeId((d.raridade_id as number | string) ?? '');
      setOrigemLore((d.origem_lore as string) || '');
      setCategoriaId((d.categoria_id as number | string) ?? '');
      setVinculoRequer(vinculoData.vinculo_requer);
      setVinculoRestricaoTipo(vinculoData.vinculo_restricao_tipo);
      setVinculoRestricao(vinculoData.vinculo_restricao);
      setVinculoDescricao(vinculoData.vinculo_descricao);
      setPropriedades(_arrToStr(d.propriedades));
      setCargas((d.cargas as number | string) ?? '');
      setUsosPorDia((d.usos_por_dia as number | string) ?? '');
      setImagem((d.imagem as string) || '');
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar equipamento: ${message}`);
    }
  };

  const setField = (name: EquipField, value: string | number | boolean) => {
    const setters: Record<EquipField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      elemento: setElemento as (v: never) => void,
      bonus: setBonus as (v: never) => void,
      dano_base: setDanoBase as (v: never) => void,
      requisitos: setRequisitos as (v: never) => void,
      numero: setNumero as (v: never) => void,
      raridade_id: setRaridadeId as (v: never) => void,
      origem_lore: setOrigemLore as (v: never) => void,
      categoria_id: setCategoriaId as (v: never) => void,
      vinculo_requer: setVinculoRequer as (v: never) => void,
      vinculo_restricao_tipo: setVinculoRestricaoTipo as (v: never) => void,
      vinculo_restricao: setVinculoRestricao as (v: never) => void,
      vinculo_descricao: setVinculoDescricao as (v: never) => void,
      propriedades: setPropriedades as (v: never) => void,
      cargas: setCargas as (v: never) => void,
      usos_por_dia: setUsosPorDia as (v: never) => void,
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

  const _buildVinculo = () => {
    if (!vinculo_requer) return null;
    const vinculo: Record<string, unknown> = { requer: true };
    if (vinculo_restricao_tipo) vinculo.restricao_tipo = vinculo_restricao_tipo;
    const restricao = vinculo_restricao ? vinculo_restricao.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (restricao.length > 0) vinculo.restricao = restricao;
    if (vinculo_descricao) vinculo.descricao = vinculo_descricao;
    return vinculo;
  };

  const _buildData = () => ({
    nome,
    descricao: descricao || null,
    tipo: _parseArr(tipo),
    elemento: _parseArr(elemento),
    bonus: _parseJson(bonus),
    dano_base: dano_base ? String(dano_base) : null,
    requisitos: _parseJson(requisitos),
    propriedades: _parseArr(propriedades),
    cargas: cargas ? parseInt(String(cargas)) : null,
    usos_por_dia: usos_por_dia ? parseInt(String(usos_por_dia)) : null,
    numero: numero ? parseInt(String(numero)) : null,
    raridade_id: raridade_id ? parseInt(String(raridade_id)) : null,
    origem_lore: origem_lore || null,
    vinculo: _buildVinculo(),
    categoria_id: categoria_id ? parseInt(String(categoria_id)) : null,
    ...(imagem ? { imagem } : {}),
  });

  const saveEquipamento = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await equipamentoService.update(Number(id), _buildData());
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar equipamento: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, tipo, elemento, bonus, dano_base, requisitos, numero,
    raridade_id, origem_lore, categoria_id,
    vinculo_requer, vinculo_restricao_tipo, vinculo_restricao, vinculo_descricao,
    propriedades, cargas, usos_por_dia,
    raridades, categorias, loading, saving, error,
    imagem, setImagem,
    setField, saveEquipamento, clearError,
  };
};
