import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { monstroService, catalogoService } from '../../../services/index';
import type { EquipamentoRel } from '../../Equipamento/Lista/equipamento-lista.model';

type MonstroField =
  | 'nome' | 'descricao' | 'tipo' | 'elemento' | 'raridade_id' | 'categoria_id'
  | 'nivel_min' | 'nivel_max' | 'hp_base' | 'xp_base'
  | 'forca' | 'destreza' | 'constituicao' | 'inteligencia' | 'sabedoria' | 'carisma'
  | 'ataque' | 'defesa' | 'dano_base';

export const useMonstroEditarModel = () => {
  const { id } = useParams<{ id: string }>();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [raridade_id, setRaridadeId] = useState<number | string>('');
  const [categoria_id, setCategoriaId] = useState<number | string>('');
  const [nivel_min, setNivelMin] = useState<number | string>(1);
  const [nivel_max, setNivelMax] = useState<number | string>(1);
  const [hp_base, setHpBase] = useState<number | string>(10);
  const [xp_base, setXpBase] = useState<number | string>(10);
  const [forca, setForca] = useState<number | string>(10);
  const [destreza, setDestreza] = useState<number | string>(10);
  const [constituicao, setConstituicao] = useState<number | string>(10);
  const [inteligencia, setInteligencia] = useState<number | string>(10);
  const [sabedoria, setSabedoria] = useState<number | string>(10);
  const [carisma, setCarisma] = useState<number | string>(10);
  const [ataque, setAtaque] = useState<number | string>(0);
  const [defesa, setDefesa] = useState<number | string>(0);
  const [dano_base, setDanoBase] = useState<number | string>(0);
  const [raridades, setRaridades] = useState<EquipamentoRel[]>([]);
  const [categorias, setCategorias] = useState<EquipamentoRel[]>([]);
  const [imagem, setImagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const _arrToStr = (val: unknown): string => {
    if (!val) return '';
    return Array.isArray(val) ? val.join(', ') : String(val);
  };

  useEffect(() => {
    if (id) loadMonstro(id);
    return () => setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMonstro = async (monstroId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasMonstro(),
      ]);
      setRaridades(((rarRes as { data?: EquipamentoRel[] }).data) || []);
      setCategorias(((catRes as { data?: EquipamentoRel[] }).data) || []);

      const { data } = await monstroService.getById(Number(monstroId));
      const d = data as Record<string, unknown>;
      setNome((d.nome as string) || '');
      setDescricao((d.descricao as string) || '');
      setTipo(_arrToStr(d.tipo));
      setElemento(_arrToStr(d.elemento));
      setRaridadeId((d.raridade_id as number | string) ?? '');
      setCategoriaId((d.categoria_id as number | string) ?? '');
      setNivelMin((d.nivel_min as number) ?? 1);
      setNivelMax((d.nivel_max as number) ?? 1);
      setHpBase((d.hp_base as number) ?? 10);
      setXpBase((d.xp_base as number) ?? 10);
      setForca((d.forca as number) ?? 10);
      setDestreza((d.destreza as number) ?? 10);
      setConstituicao((d.constituicao as number) ?? 10);
      setInteligencia((d.inteligencia as number) ?? 10);
      setSabedoria((d.sabedoria as number) ?? 10);
      setCarisma((d.carisma as number) ?? 10);
      setAtaque((d.ataque_base as number) ?? 0);
      setDefesa((d.defesa_base as number) ?? 0);
      setDanoBase((d.dano_base as number | string) ?? 0);
      setImagem((d.imagem as string) || '');
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setLoading(false);
      setError(`Erro ao carregar monstro: ${message}`);
    }
  };

  const setField = useCallback((name: MonstroField, value: string | number) => {
    const setters: Record<MonstroField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      elemento: setElemento as (v: never) => void,
      raridade_id: setRaridadeId as (v: never) => void,
      categoria_id: setCategoriaId as (v: never) => void,
      nivel_min: setNivelMin as (v: never) => void,
      nivel_max: setNivelMax as (v: never) => void,
      hp_base: setHpBase as (v: never) => void,
      xp_base: setXpBase as (v: never) => void,
      forca: setForca as (v: never) => void,
      destreza: setDestreza as (v: never) => void,
      constituicao: setConstituicao as (v: never) => void,
      inteligencia: setInteligencia as (v: never) => void,
      sabedoria: setSabedoria as (v: never) => void,
      carisma: setCarisma as (v: never) => void,
      ataque: setAtaque as (v: never) => void,
      defesa: setDefesa as (v: never) => void,
      dano_base: setDanoBase as (v: never) => void,
    };
    setters[name]?.(value as never);
  }, []);

  const _parseArr = (str: string): string[] => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const _buildData = () => {
    const int = (v: string | number) => parseInt(String(v)) || 0;
    return {
      nome, descricao: descricao || null,
      tipo: _parseArr(tipo),
      raridade_id: raridade_id ? parseInt(String(raridade_id)) : null,
      categoria_id: categoria_id ? parseInt(String(categoria_id)) : null,
      nivel_min: int(nivel_min), nivel_max: int(nivel_max), hp_base: int(hp_base),
      forca: int(forca), destreza: int(destreza), constituicao: int(constituicao),
      inteligencia: int(inteligencia), sabedoria: int(sabedoria), carisma: int(carisma),
      ataque_base: int(ataque), defesa_base: int(defesa), dano_base: String(dano_base),
      xp_base: int(xp_base), elemento: _parseArr(elemento),
      ...(imagem ? { imagem } : {}),
    };
  };

  const saveMonstro = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    if (!id) { setError('ID nao informado'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await monstroService.update(Number(id), _buildData());
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao salvar monstro: ${message}`);
      return { success: false };
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    nome, descricao, tipo, elemento, raridade_id, categoria_id,
    nivel_min, nivel_max, hp_base, xp_base,
    forca, destreza, constituicao, inteligencia, sabedoria, carisma,
    ataque, defesa, dano_base,
    raridades, categorias, loading, saving, error,
    imagem, setImagem,
    setField, saveMonstro, clearError,
  };
};
