import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personagemService, equipamentoService, historiaService } from '../../../services/index.js';
import { useTheme } from '../../../contexts/theme.jsx';

export const usePersonagemVerModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Core state
  const [personagem, setPersonagem] = useState(null);
  const [evolucao, setEvolucao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Background generation
  const [gerandoBackground, setGerandoBackground] = useState(false);

  // Validation
  const [validacao, setValidacao] = useState(null);
  const [validando, setValidando] = useState(false);

  // Point distribution
  const [distribuindo, setDistribuindo] = useState(false);
  const [pontosParaDistribuir, setPontosParaDistribuir] = useState({});

  // Equipment / Inventory
  const [equipamentos, setEquipamentos] = useState([]);
  const [catalogoEquipamentos, setCatalogoEquipamentos] = useState([]);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Historias
  const [historiasDisponiveis, setHistoriasDisponiveis] = useState([]);
  const [mostrarSeletorHistoria, setMostrarSeletorHistoria] = useState(false);
  const [loadingHistorias, setLoadingHistorias] = useState(false);

  // Computed
  const totalPontosDistribuir = useMemo(
    () => Object.values(pontosParaDistribuir).reduce((a, b) => a + b, 0),
    [pontosParaDistribuir]
  );

  // Load character on mount
  useEffect(() => {
    if (id) {
      loadPersonagem(id);
    }
  }, [id]);

  const loadPersonagem = async (personagemId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await personagemService.getById(personagemId);
      const data = response?.data || response;
      setPersonagem(data);
      setLoading(false);

      // Load evolution and equipment in parallel
      loadEvolucao(personagemId);
      loadEquipamentos(personagemId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadEvolucao = async (personagemId) => {
    try {
      const data = await personagemService.obterEvolucao(personagemId);
      setEvolucao(data);
    } catch (err) {
      console.warn('Evolucao not available:', err.message);
    }
  };

  const gerarBackground = useCallback(async (sugestao = '') => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setGerandoBackground(true);
    try {
      const resultado = await personagemService.gerarBackground(personagemId, sugestao);
      if (resultado?.background) {
        setPersonagem(prev => ({
          ...prev,
          background: resultado.background,
        }));
      }
    } catch (err) {
      setError(`Erro ao gerar background: ${err.message}`);
    } finally {
      setGerandoBackground(false);
    }
  }, [personagem?.id]);

  const validarCoerencia = useCallback(async () => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setValidando(true);
    try {
      const data = await personagemService.validarCoerencia(personagemId);
      setValidacao(data);
    } catch (err) {
      setError(`Erro ao validar: ${err.message}`);
    } finally {
      setValidando(false);
    }
  }, [personagem?.id]);

  const setPontoAtributo = useCallback((atributo, valor) => {
    setPontosParaDistribuir(prev => ({
      ...prev,
      [atributo]: Math.max(0, valor),
    }));
  }, []);

  const distribuirPontos = useCallback(async () => {
    const personagemId = personagem?.id;
    const total = Object.values(pontosParaDistribuir).reduce((a, b) => a + b, 0);
    if (!personagemId || total === 0) return;

    setDistribuindo(true);
    try {
      await personagemService.distribuirPontos(personagemId, pontosParaDistribuir);
      setPontosParaDistribuir({});
      // Reload character + evolution
      await loadPersonagem(personagemId);
    } catch (err) {
      setError(`Erro ao distribuir pontos: ${err.message}`);
    } finally {
      setDistribuindo(false);
    }
  }, [personagem?.id, pontosParaDistribuir]);

  // Equipment methods
  const loadEquipamentos = async (personagemId) => {
    const pid = personagemId || personagem?.id;
    if (!pid) return;

    setLoadingEquipamentos(true);
    try {
      const data = await personagemService.listarEquipamentos(pid);
      setEquipamentos(data || []);
    } catch (err) {
      console.warn('Erro ao carregar equipamentos:', err.message);
      setEquipamentos([]);
    } finally {
      setLoadingEquipamentos(false);
    }
  };

  const loadCatalogo = async () => {
    try {
      const response = await equipamentoService.getAll();
      const catalogo = response?.data || response || [];
      setCatalogoEquipamentos(Array.isArray(catalogo) ? catalogo : []);
    } catch (err) {
      console.warn('Erro ao carregar catalogo:', err.message);
    }
  };

  const adicionarEquipamento = useCallback(async (equipamentoId) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingEquipamentos(true);
    try {
      await personagemService.adicionarEquipamento(personagemId, equipamentoId);
      await loadEquipamentos(personagemId);
    } catch (err) {
      setError(`Erro ao adicionar equipamento: ${err.message}`);
      setLoadingEquipamentos(false);
    }
  }, [personagem?.id]);

  const removerEquipamento = useCallback(async (equipamentoId) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingEquipamentos(true);
    try {
      await personagemService.removerEquipamento(personagemId, equipamentoId);
      await loadEquipamentos(personagemId);
    } catch (err) {
      setError(`Erro ao remover equipamento: ${err.message}`);
      setLoadingEquipamentos(false);
    }
  }, [personagem?.id]);

  const toggleCatalogo = useCallback(() => {
    setMostrarCatalogo(prev => {
      const newVal = !prev;
      if (newVal && catalogoEquipamentos.length === 0) {
        loadCatalogo();
      }
      return newVal;
    });
  }, [catalogoEquipamentos.length]);

  const catalogoFiltrado = useMemo(() => {
    const idsEquipados = new Set(equipamentos.map(e => e.id));

    return catalogoEquipamentos
      .filter(eq => {
        if (buscaCatalogo) {
          const termo = buscaCatalogo.toLowerCase();
          return eq.nome?.toLowerCase().includes(termo) ||
                 eq.descricao?.toLowerCase().includes(termo);
        }
        return true;
      })
      .map(eq => ({
        ...eq,
        jaEquipado: idsEquipados.has(eq.id),
      }));
  }, [catalogoEquipamentos, equipamentos, buscaCatalogo]);

  const bonusAgregados = useMemo(() => {
    if (!equipamentos?.length) return {};

    const totais = {};
    equipamentos.forEach(eq => {
      if (eq.bonus && typeof eq.bonus === 'object') {
        Object.entries(eq.bonus).forEach(([key, value]) => {
          totais[key] = (totais[key] || 0) + Number(value);
        });
      }
    });
    return totais;
  }, [equipamentos]);

  // Historia methods
  const loadHistoriasDisponiveis = async () => {
    try {
      const response = await historiaService.getAll();
      const historias = Array.isArray(response) ? response : response?.data || [];
      setHistoriasDisponiveis(historias);
    } catch (err) {
      console.warn('Erro ao carregar historias:', err.message);
    }
  };

  const toggleSeletorHistoria = useCallback(() => {
    setMostrarSeletorHistoria(prev => {
      const newVal = !prev;
      if (newVal && historiasDisponiveis.length === 0) {
        loadHistoriasDisponiveis();
      }
      return newVal;
    });
  }, [historiasDisponiveis.length]);

  const vincularHistoria = useCallback(async (historiaId) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingHistorias(true);
    try {
      await personagemService.vincularHistoria(personagemId, historiaId);
      await loadPersonagem(personagemId);
      setMostrarSeletorHistoria(false);
    } catch (err) {
      setError(`Erro ao vincular historia: ${err.message}`);
    } finally {
      setLoadingHistorias(false);
    }
  }, [personagem?.id]);

  const desvincularHistoria = useCallback(async (historiaId) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingHistorias(true);
    try {
      await personagemService.desvincularHistoria(personagemId, historiaId);
      await loadPersonagem(personagemId);
    } catch (err) {
      setError(`Erro ao desvincular historia: ${err.message}`);
    } finally {
      setLoadingHistorias(false);
    }
  }, [personagem?.id]);

  const historiasNaoVinculadas = useMemo(() => {
    const idsVinculados = new Set((personagem?.historias || []).map(h => h.id));
    return historiasDisponiveis.filter(h => !idsVinculados.has(h.id));
  }, [historiasDisponiveis, personagem?.historias]);

  const clearError = useCallback(() => setError(null), []);

  return {
    personagem,
    evolucao,
    loading,
    error,
    isLight,
    navigate,
    // Background
    gerandoBackground,
    gerarBackground,
    // Validation
    validacao,
    validando,
    validarCoerencia,
    // Point distribution
    distribuindo,
    pontosParaDistribuir,
    totalPontosDistribuir,
    setPontoAtributo,
    distribuirPontos,
    // Equipment
    equipamentos,
    loadingEquipamentos,
    mostrarCatalogo,
    buscaCatalogo,
    setBuscaCatalogo,
    toggleCatalogo,
    catalogoFiltrado,
    bonusAgregados,
    adicionarEquipamento,
    removerEquipamento,
    confirmRemove,
    setConfirmRemove,
    // Historias
    mostrarSeletorHistoria,
    toggleSeletorHistoria,
    historiasNaoVinculadas,
    loadingHistorias,
    vincularHistoria,
    desvincularHistoria,
    // Actions
    clearError,
  };
};
