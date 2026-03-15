import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipamentoService, catalogoService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useEquipamentoEditarModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [bonus, setBonus] = useState('');
  const [dano_base, setDanoBase] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [numero, setNumero] = useState('');
  const [raridade_id, setRaridadeId] = useState('');
  const [origem_lore, setOrigemLore] = useState('');
  const [categoria_id, setCategoriaId] = useState('');
  const [vinculo_requer, setVinculoRequer] = useState(false);
  const [vinculo_restricao_tipo, setVinculoRestricaoTipo] = useState('');
  const [vinculo_restricao, setVinculoRestricao] = useState('');
  const [vinculo_descricao, setVinculoDescricao] = useState('');
  const [propriedades, setPropriedades] = useState('');
  const [cargas, setCargas] = useState('');
  const [usos_por_dia, setUsosPorDia] = useState('');
  const [raridades, setRaridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [imagem, setImagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const _jsonToStr = (val) => {
    if (!val) return '';
    return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
  };

  const _arrToStr = (val) => {
    if (!val) return '';
    return Array.isArray(val) ? val.join(', ') : String(val);
  };

  const _loadVinculo = (vinculo) => {
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
  }, [id]);

  const loadEquipamento = async (equipId) => {
    setLoading(true);
    setError(null);
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasEquipamento(),
      ]);
      setRaridades(rarRes.data || []);
      setCategorias(catRes.data || []);

      const { data } = await equipamentoService.getById(equipId);
      const vinculoData = _loadVinculo(data.vinculo);

      setNome(data.nome || '');
      setDescricao(data.descricao || '');
      setTipo(_arrToStr(data.tipo));
      setElemento(_arrToStr(data.elemento));
      setBonus(_jsonToStr(data.bonus));
      setDanoBase(data.dano_base ?? '');
      setRequisitos(_jsonToStr(data.requisitos));
      setNumero(data.numero ?? '');
      setRaridadeId(data.raridade_id ?? '');
      setOrigemLore(data.origem_lore || '');
      setCategoriaId(data.categoria_id ?? '');
      setVinculoRequer(vinculoData.vinculo_requer);
      setVinculoRestricaoTipo(vinculoData.vinculo_restricao_tipo);
      setVinculoRestricao(vinculoData.vinculo_restricao);
      setVinculoDescricao(vinculoData.vinculo_descricao);
      setPropriedades(_arrToStr(data.propriedades));
      setCargas(data.cargas ?? '');
      setUsosPorDia(data.usos_por_dia ?? '');
      setImagem(data.imagem || '');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Erro ao carregar equipamento: ${err.message}`);
    }
  };

  const setField = (name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, tipo: setTipo, elemento: setElemento,
      bonus: setBonus, dano_base: setDanoBase, requisitos: setRequisitos, numero: setNumero,
      raridade_id: setRaridadeId, origem_lore: setOrigemLore, categoria_id: setCategoriaId,
      vinculo_requer: setVinculoRequer, vinculo_restricao_tipo: setVinculoRestricaoTipo,
      vinculo_restricao: setVinculoRestricao, vinculo_descricao: setVinculoDescricao,
      propriedades: setPropriedades, cargas: setCargas, usos_por_dia: setUsosPorDia,
    };
    setters[name]?.(value);
  };

  const _parseJson = (str) => {
    if (!str) return null;
    try { return JSON.parse(str); } catch { return str; }
  };

  const _parseArr = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const _buildVinculo = () => {
    if (!vinculo_requer) return null;
    const vinculo = { requer: true };
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
    cargas: cargas ? parseInt(cargas) : null,
    usos_por_dia: usos_por_dia ? parseInt(usos_por_dia) : null,
    numero: numero ? parseInt(numero) : null,
    raridade_id: raridade_id ? parseInt(raridade_id) : null,
    origem_lore: origem_lore || null,
    vinculo: _buildVinculo(),
    categoria_id: categoria_id ? parseInt(categoria_id) : null,
    ...(imagem ? { imagem } : {}),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      await equipamentoService.update(id, _buildData());
      setSaving(false);
      navigate(ROUTES.EQUIPAMENTOS);
    } catch (err) {
      setSaving(false);
      setError(`Erro ao salvar equipamento: ${err.message}`);
    }
  };

  const handleCancel = () => navigate(ROUTES.EQUIPAMENTOS);
  const clearError = () => setError(null);

  return {
    nome, descricao, tipo, elemento, bonus, dano_base, requisitos, numero,
    raridade_id, origem_lore, categoria_id,
    vinculo_requer, vinculo_restricao_tipo, vinculo_restricao, vinculo_descricao,
    propriedades, cargas, usos_por_dia,
    raridades, categorias, loading, saving, error, isLight,
    imagem, setImagem,
    setField, handleSubmit, handleCancel, clearError,
  };
};
