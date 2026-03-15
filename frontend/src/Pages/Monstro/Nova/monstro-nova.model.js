import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { monstroService, catalogoService } from '../../../services/index.js';
import { useMonstroStore } from '../../../store/monstro/index.js';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../constants/routes.js';

export const useMonstroNovaModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarMonstros = useMonstroStore(s => s.recarregarMonstros);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('');
  const [elemento, setElemento] = useState('');
  const [raridade_id, setRaridadeId] = useState('');
  const [categoria_id, setCategoriaId] = useState('');
  const [nivel_min, setNivelMin] = useState(1);
  const [nivel_max, setNivelMax] = useState(1);
  const [hp_base, setHpBase] = useState(10);
  const [xp_base, setXpBase] = useState(10);
  const [forca, setForca] = useState(10);
  const [destreza, setDestreza] = useState(10);
  const [constituicao, setConstituicao] = useState(10);
  const [inteligencia, setInteligencia] = useState(10);
  const [sabedoria, setSabedoria] = useState(10);
  const [carisma, setCarisma] = useState(10);
  const [ataque, setAtaque] = useState(0);
  const [defesa, setDefesa] = useState(0);
  const [dano_base, setDanoBase] = useState(0);
  const [raridades, setRaridades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [imagem, setImagem] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCatalogos();
    return () => setError(null);
  }, []);

  const loadCatalogos = async () => {
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasMonstro(),
      ]);
      setRaridades(rarRes.data || []);
      setCategorias(catRes.data || []);
    } catch (e) {
      console.error('Erro ao carregar catalogos:', e.message);
    }
  };

  const setField = useCallback((name, value) => {
    const setters = {
      nome: setNome, descricao: setDescricao, tipo: setTipo, elemento: setElemento,
      raridade_id: setRaridadeId, categoria_id: setCategoriaId,
      nivel_min: setNivelMin, nivel_max: setNivelMax, hp_base: setHpBase, xp_base: setXpBase,
      forca: setForca, destreza: setDestreza, constituicao: setConstituicao,
      inteligencia: setInteligencia, sabedoria: setSabedoria, carisma: setCarisma,
      ataque: setAtaque, defesa: setDefesa, dano_base: setDanoBase,
    };
    setters[name]?.(value);
  }, []);

  const _parseArr = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const _buildData = () => {
    const int = (v) => parseInt(v) || 0;
    return {
      nome, descricao: descricao || null,
      tipo: _parseArr(tipo),
      raridade_id: raridade_id ? parseInt(raridade_id) : null,
      categoria_id: categoria_id ? parseInt(categoria_id) : null,
      nivel_min: int(nivel_min), nivel_max: int(nivel_max), hp_base: int(hp_base),
      forca: int(forca), destreza: int(destreza), constituicao: int(constituicao),
      inteligencia: int(inteligencia), sabedoria: int(sabedoria), carisma: int(carisma),
      ataque_base: int(ataque), defesa_base: int(defesa), dano_base: String(dano_base),
      xp_base: int(xp_base), elemento: _parseArr(elemento),
      ...(imagem ? { imagem } : {}),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    setError(null);
    try {
      await monstroService.create(_buildData());
      await recarregarMonstros();
      setSaving(false);
      navigate(ROUTES.MONSTROS);
    } catch (err) {
      setSaving(false);
      setError(`Erro ao criar monstro: ${err.message}`);
    }
  };

  const handleCancel = useCallback(() => navigate(ROUTES.MONSTROS), [navigate]);
  const clearError = useCallback(() => setError(null), []);

  return {
    nome, descricao, tipo, elemento, raridade_id, categoria_id,
    nivel_min, nivel_max, hp_base, xp_base,
    forca, destreza, constituicao, inteligencia, sabedoria, carisma,
    ataque, defesa, dano_base,
    raridades, categorias, saving, error, isLight,
    imagem, setImagem,
    setField, handleSubmit, handleCancel, clearError,
  };
};
