import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { personagemService, equipamentoService, historiaService } from '../../../services/index.js';
import { apiClient } from '../../../services/ApiClient.js';
import { sanitizeTextForSpeech } from '../../../utils/speechText.js';
import { ABILITIES } from '../../../utils/dnd5eData.js';
import { getDnd5eModifier, formatModifier } from '../../../utils/rpgHelpers.js';
import { TRESDET_ATTR_CONFIG } from '../../../constants/tresdetAtributos.js';

// Atributos do sistema Lunaria (caminho default). Keys casam com o mapa
// `atributos` retornado pelo backend (e com os campos escalares legados).
const LUNARIA_ATTRS = [
  { key: 'forca', label: 'Forca' },
  { key: 'inteligencia', label: 'Inteligencia' },
  { key: 'constituicao', label: 'Constituicao' },
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'carisma', label: 'Carisma' },
];

/**
 * Monta a lista de atributos a exibir conforme o sistema do personagem.
 * O backend ja entrega `personagem.atributos` keyed corretamente por sistema
 * (STR/DEX/... para D&D, F/H/... para 3D&T, forca/... para Lunaria).
 * Retorna `{ sistema, atributos: [{ key, label, valor, modificador }] }`,
 * com `modificador` presente apenas onde fizer sentido (Lunaria e D&D 5e).
 */
function montarAtributosView(personagem) {
  if (!personagem) return { sistema: 'lunaria', atributos: [] };
  const sistema = personagem.sistema || 'lunaria';
  const mapa = personagem.atributos || {};

  if (sistema === 'dnd5e') {
    return {
      sistema,
      atributos: ABILITIES.map(({ id, nome }) => {
        const valor = mapa[id] ?? 10;
        return { key: id, label: nome, valor, modificador: formatModifier(getDnd5eModifier(valor)) };
      }),
    };
  }

  if (sistema === 'tresdet') {
    return {
      sistema,
      atributos: TRESDET_ATTR_CONFIG.map(({ key, label }) => ({
        key,
        label,
        valor: mapa[key] ?? 0,
        modificador: null,
      })),
    };
  }

  return {
    sistema: 'lunaria',
    atributos: LUNARIA_ATTRS.map(({ key, label }) => {
      const valor = mapa[key] ?? personagem[key] ?? 10;
      return { key, label, valor, modificador: formatModifier(getDnd5eModifier(valor)) };
    }),
  };
}

export const usePersonagemVerModel = ({ navigate } = {}) => {
  const { id } = useParams();

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

  // Audio background
  const [audioUrl, setAudioUrl] = useState(null);
  const [gerandoAudio, setGerandoAudio] = useState(false);
  const audioUrlRef = useRef(null);

  // Historias
  const [historiasDisponiveis, setHistoriasDisponiveis] = useState([]);
  const [mostrarSeletorHistoria, setMostrarSeletorHistoria] = useState(false);
  const [loadingHistorias, setLoadingHistorias] = useState(false);

  // Computed
  const totalPontosDistribuir = useMemo(
    () => Object.values(pontosParaDistribuir).reduce((a, b) => a + b, 0),
    [pontosParaDistribuir]
  );

  // Atributos a exibir, ja resolvidos por sistema (D&D 5e, 3D&T ou Lunaria).
  const atributosView = useMemo(() => montarAtributosView(personagem), [personagem]);

  // Soma total dos atributos do personagem (transparencia para o jogador
  // auditar a ficha). Computada no Model — a View so exibe.
  const somaAtributos = useMemo(
    () => atributosView.atributos.reduce((sum, a) => sum + (Number(a.valor) || 0), 0),
    [atributosView]
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

  // Keys de atributo validas para distribuir pontos, ja resolvidas por sistema.
  // Casam com `getAttrNamesForSystem` do backend (D&D STR/DEX/..., 3D&T F/H/...,
  // Lunaria forca/...) — o painel de distribuicao nunca envia key de outro sistema.
  const pontosDistribuicaoAttrs = useMemo(
    () => atributosView.atributos.map(({ key, label }) => ({ key, label })),
    [atributosView]
  );

  const setPontoAtributo = useCallback((atributo, valor) => {
    setPontosParaDistribuir(prev => ({
      ...prev,
      [atributo]: Math.max(0, valor),
    }));
  }, []);

  const distribuirPontos = useCallback(async () => {
    const personagemId = personagem?.id;
    // So envia keys do sistema do personagem (fail loud no backend caso contrario).
    const keysSistema = new Set(atributosView.atributos.map(a => a.key));
    const incrementos = Object.fromEntries(
      Object.entries(pontosParaDistribuir).filter(([k, v]) => keysSistema.has(k) && v > 0)
    );
    const total = Object.values(incrementos).reduce((a, b) => a + b, 0);
    if (!personagemId || total === 0) return;

    setDistribuindo(true);
    try {
      await personagemService.distribuirPontos(personagemId, incrementos);
      setPontosParaDistribuir({});
      // Reload character + evolution
      await loadPersonagem(personagemId);
    } catch (err) {
      setError(`Erro ao distribuir pontos: ${err.message}`);
    } finally {
      setDistribuindo(false);
    }
  }, [personagem?.id, pontosParaDistribuir, atributosView]);

  // Equipment methods
  const loadEquipamentos = async (personagemId) => {
    const pid = personagemId || personagem?.id;
    if (!pid) return;

    setLoadingEquipamentos(true);
    try {
      const raw = await personagemService.listarEquipamentos(pid);
      const data = (raw || []).map(item => item.equipamento || item);
      setEquipamentos(data);
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

  // Imagem handler
  const handleImagemGenerated = useCallback(async (url) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;
    try {
      await personagemService.update(personagemId, { imagem: url });
      setPersonagem(prev => ({ ...prev, imagem: url }));
    } catch (err) {
      setError(err.message || 'Erro ao salvar imagem');
    }
  }, [personagem?.id]);

  const gerarAudioBackground = useCallback(async () => {
    const text = personagem?.background;
    const speechText = sanitizeTextForSpeech(text || '');
    if (!speechText || gerandoAudio) return;

    setGerandoAudio(true);
    try {
      const response = await apiClient.client.post('/tts/generate', {
        text: speechText,
        provider: 'opensource',
        voiceId: 'pt-br-kokoro-santa',
      }, { responseType: 'blob' });

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(response.data);
      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      setError(`Erro ao gerar audio: ${err.message}`);
    } finally {
      setGerandoAudio(false);
    }
  }, [personagem?.background, gerandoAudio]);

  const clearError = useCallback(() => setError(null), []);

  return {
    personagem,
    evolucao,
    loading,
    error,
    navigate,
    // Atributos resolvidos por sistema
    atributosView,
    somaAtributos,
    pontosDistribuicaoAttrs,
    // Background
    gerandoBackground,
    gerarBackground,
    // Imagem
    handleImagemGenerated,
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
    // Audio
    audioUrl,
    gerandoAudio,
    gerarAudioBackground,
    // Actions
    clearError,
  };
};
