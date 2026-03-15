import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { habilidadeService } from '../../../services/index.js';
import { useHabilidadeStore } from '../../../store/habilidade';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../routes.jsx';

export const useHabilidadeEditarModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const carregarHabilidades = useHabilidadeStore(s => s.carregarHabilidades);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custo_mana, setCustoMana] = useState(0);
  const [dano_base, setDanoBase] = useState('');
  const [tipo, setTipo] = useState('dano');
  const [elemento, setElemento] = useState('');
  const [nivel_requerido, setNivelRequerido] = useState(1);
  const [cooldown_turnos, setCooldownTurnos] = useState(0);
  const [classe_id, setClasseId] = useState('');
  const [alvo, setAlvo] = useState('inimigo');
  const [alcance, setAlcance] = useState('medio');
  const [tempo_conjuracao, setTempoConjuracao] = useState('acao');
  const [usa_concentracao, setUsaConcentracao] = useState(false);
  const [categoria, setCategoria] = useState('combate_fisico');
  const [escola_magia, setEscolaMagia] = useState('');
  const [raca_id, setRacaId] = useState('');
  const [usos_por_descanso, setUsosPorDescanso] = useState('');
  const [saving_throw, setSavingThrow] = useState('');
  const [efeito, setEfeito] = useState('');
  const [escalamento, setEscalamento] = useState('');
  const [pre_requisito, setPreRequisito] = useState('');
  const [area_efeito, setAreaEfeito] = useState('');
  const [componente_material, setComponenteMaterial] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const _jsonToStr = (val) => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  useEffect(() => {
    if (id) loadHabilidade(id);
    return () => setError(null);
  }, [id]);

  const loadHabilidade = async (habId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await habilidadeService.getById(habId);
      const data = response.data;

      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setCustoMana(data.custo_mana ?? 0);
      setDanoBase(data.dano_base || '');
      setTipo(data.tipo || 'dano');
      setElemento(data.elemento || '');
      setNivelRequerido(data.nivel_requerido ?? 1);
      setCooldownTurnos(data.cooldown_turnos ?? 0);
      setClasseId(data.classe_id ?? '');
      setAlvo(data.alvo || 'inimigo');
      setAlcance(data.alcance || 'medio');
      setTempoConjuracao(data.tempo_conjuracao || 'acao');
      setUsaConcentracao(data.usa_concentracao ?? false);
      setCategoria(data.categoria || 'combate_fisico');
      setEscolaMagia(data.escola_magia || '');
      setRacaId(data.raca_id ?? '');
      setUsosPorDescanso(data.usos_por_descanso ?? '');
      setSavingThrow(data.saving_throw || '');
      setEfeito(_jsonToStr(data.efeito));
      setEscalamento(_jsonToStr(data.escalamento));
      setPreRequisito(_jsonToStr(data.pre_requisitos ?? data.pre_requisito));
      setAreaEfeito(_jsonToStr(data.area_efeito));
      setComponenteMaterial(_jsonToStr(data.componente_material));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar habilidade: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, custo_mana: setCustoMana,
      dano_base: setDanoBase, tipo: setTipo, elemento: setElemento,
      nivel_requerido: setNivelRequerido, cooldown_turnos: setCooldownTurnos,
      classe_id: setClasseId, alvo: setAlvo, alcance: setAlcance,
      tempo_conjuracao: setTempoConjuracao, usa_concentracao: setUsaConcentracao,
      categoria: setCategoria, escola_magia: setEscolaMagia, raca_id: setRacaId,
      usos_por_descanso: setUsosPorDescanso, saving_throw: setSavingThrow,
      efeito: setEfeito, escalamento: setEscalamento, pre_requisito: setPreRequisito,
      area_efeito: setAreaEfeito, componente_material: setComponenteMaterial,
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
    custo_mana: parseInt(custo_mana) || 0,
    dano_base: dano_base || null,
    tipo: tipo || 'dano',
    elemento: elemento || null,
    nivel_requerido: parseInt(nivel_requerido) || 1,
    cooldown_turnos: parseInt(cooldown_turnos) || 0,
    classe_id: classe_id ? parseInt(classe_id) : null,
    alvo: alvo || 'inimigo',
    alcance: alcance || 'medio',
    tempo_conjuracao: tempo_conjuracao || 'acao',
    usa_concentracao,
    categoria: categoria || 'combate_fisico',
    escola_magia: escola_magia || null,
    raca_id: raca_id ? parseInt(raca_id) : null,
    usos_por_descanso: usos_por_descanso ? parseInt(usos_por_descanso) : null,
    saving_throw: saving_throw || null,
    efeito: _parseJson(efeito),
    escalamento: _parseJson(escalamento),
    pre_requisito: _parseJson(pre_requisito),
    pre_requisitos: _parseJson(pre_requisito),
    area_efeito: _parseJson(area_efeito),
    componente_material: _parseJson(componente_material),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      await habilidadeService.update(id, _buildData());
      await carregarHabilidades({}, true);
      setSaving(false);
      navigate(ROUTES.HABILIDADES);
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar habilidade: ${err.message}`);
    }
  };

  const handleCancel = () => navigate(ROUTES.HABILIDADES);
  const clearError = () => setError(null);

  return {
    nome, descricao, custo_mana, dano_base, tipo, elemento, nivel_requerido,
    cooldown_turnos, classe_id, alvo, alcance, tempo_conjuracao, usa_concentracao,
    categoria, escola_magia, raca_id, usos_por_descanso, saving_throw,
    efeito, escalamento, pre_requisito, area_efeito, componente_material,
    loading, saving, error, isLight,
    setField, handleSubmit, handleCancel, clearError,
  };
};
