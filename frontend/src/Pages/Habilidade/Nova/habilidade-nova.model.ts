import { useState, useEffect } from 'react';
import { habilidadeService } from '../../../services/index';
import { useHabilidadeStore } from '../../../store/habilidade';

type HabilidadeField =
  | 'nome' | 'descricao' | 'custo_mana' | 'dano_base' | 'tipo' | 'elemento'
  | 'nivel_requerido' | 'cooldown_turnos' | 'classe_id' | 'alvo' | 'alcance'
  | 'tempo_conjuracao' | 'usa_concentracao' | 'categoria' | 'escola_magia'
  | 'raca_id' | 'usos_por_descanso' | 'saving_throw' | 'efeito' | 'escalamento'
  | 'pre_requisito' | 'area_efeito' | 'componente_material';

export const useHabilidadeNovaModel = () => {
  const carregarHabilidades = useHabilidadeStore(s => s.carregarHabilidades);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo_mana, setCustoMana] = useState<number | string>(0);
  const [dano_base, setDanoBase] = useState('');
  const [tipo, setTipo] = useState('dano');
  const [elemento, setElemento] = useState('');
  const [nivel_requerido, setNivelRequerido] = useState<number | string>(1);
  const [cooldown_turnos, setCooldownTurnos] = useState<number | string>(0);
  const [classe_id, setClasseId] = useState<number | string>('');
  const [alvo, setAlvo] = useState('inimigo');
  const [alcance, setAlcance] = useState('medio');
  const [tempo_conjuracao, setTempoConjuracao] = useState('acao');
  const [usa_concentracao, setUsaConcentracao] = useState(false);
  const [categoria, setCategoria] = useState('combate_fisico');
  const [escola_magia, setEscolaMagia] = useState('');
  const [raca_id, setRacaId] = useState<number | string>('');
  const [usos_por_descanso, setUsosPorDescanso] = useState<number | string>('');
  const [saving_throw, setSavingThrow] = useState('');
  const [efeito, setEfeito] = useState('');
  const [escalamento, setEscalamento] = useState('');
  const [pre_requisito, setPreRequisito] = useState('');
  const [area_efeito, setAreaEfeito] = useState('');
  const [componente_material, setComponenteMaterial] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => setError(null);
  }, []);

  const setField = (name: HabilidadeField, value: string | number | boolean) => {
    const setters: Record<HabilidadeField, (value: never) => void> = {
      nome: setNome as (v: never) => void,
      descricao: setDescricao as (v: never) => void,
      custo_mana: setCustoMana as (v: never) => void,
      dano_base: setDanoBase as (v: never) => void,
      tipo: setTipo as (v: never) => void,
      elemento: setElemento as (v: never) => void,
      nivel_requerido: setNivelRequerido as (v: never) => void,
      cooldown_turnos: setCooldownTurnos as (v: never) => void,
      classe_id: setClasseId as (v: never) => void,
      alvo: setAlvo as (v: never) => void,
      alcance: setAlcance as (v: never) => void,
      tempo_conjuracao: setTempoConjuracao as (v: never) => void,
      usa_concentracao: setUsaConcentracao as (v: never) => void,
      categoria: setCategoria as (v: never) => void,
      escola_magia: setEscolaMagia as (v: never) => void,
      raca_id: setRacaId as (v: never) => void,
      usos_por_descanso: setUsosPorDescanso as (v: never) => void,
      saving_throw: setSavingThrow as (v: never) => void,
      efeito: setEfeito as (v: never) => void,
      escalamento: setEscalamento as (v: never) => void,
      pre_requisito: setPreRequisito as (v: never) => void,
      area_efeito: setAreaEfeito as (v: never) => void,
      componente_material: setComponenteMaterial as (v: never) => void,
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
    custo_mana: parseInt(String(custo_mana)) || 0,
    dano_base: dano_base || null,
    tipo: tipo || 'dano',
    elemento: elemento || null,
    nivel_requerido: parseInt(String(nivel_requerido)) || 1,
    cooldown_turnos: parseInt(String(cooldown_turnos)) || 0,
    classe_id: classe_id ? parseInt(String(classe_id)) : null,
    alvo: alvo || 'inimigo',
    alcance: alcance || 'medio',
    tempo_conjuracao: tempo_conjuracao || 'acao',
    usa_concentracao,
    categoria: categoria || 'combate_fisico',
    escola_magia: escola_magia || null,
    raca_id: raca_id ? parseInt(String(raca_id)) : null,
    usos_por_descanso: usos_por_descanso ? parseInt(String(usos_por_descanso)) : null,
    saving_throw: saving_throw || null,
    efeito: _parseJson(efeito),
    escalamento: _parseJson(escalamento),
    pre_requisito: _parseJson(pre_requisito),
    pre_requisitos: _parseJson(pre_requisito),
    area_efeito: _parseJson(area_efeito),
    componente_material: _parseJson(componente_material),
  });

  const criarHabilidade = async () => {
    if (!nome.trim()) { setError('Nome e obrigatorio'); return { success: false }; }
    setSaving(true);
    setError(null);
    try {
      await habilidadeService.create(_buildData());
      await carregarHabilidades();
      setSaving(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setSaving(false);
      setError(`Erro ao criar habilidade: ${message}`);
      return { success: false };
    }
  };

  const clearError = () => setError(null);

  return {
    nome, descricao, custo_mana, dano_base, tipo, elemento, nivel_requerido,
    cooldown_turnos, classe_id, alvo, alcance, tempo_conjuracao, usa_concentracao,
    categoria, escola_magia, raca_id, usos_por_descanso, saving_throw,
    efeito, escalamento, pre_requisito, area_efeito, componente_material,
    saving, error,
    setField, criarHabilidade, clearError,
  };
};
