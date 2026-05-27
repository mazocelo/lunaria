import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { personagemService, equipamentoService, historiaService } from '../../../services/index';
import { apiClient } from '../../../services/ApiClient';
import { sanitizeTextForSpeech } from '../../../utils/speechText';
import { ABILITIES } from '../../../utils/dnd5eData';
import { getDnd5eModifier, formatModifier } from '../../../utils/rpgHelpers';
import { TRESDET_ATTR_CONFIG } from '../../../constants/tresdetAtributos';

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

interface PersonagemRaw {
  id?: number | null;
  sistema?: string;
  atributos?: Record<string, number>;
  background?: string | null;
  historias?: Array<{ id?: number | string } & Record<string, unknown>>;
  imagem?: string | null;
  [key: string]: unknown;
}

interface AtributoView {
  key: string;
  label: string;
  valor: number;
  modificador: string | null;
}

interface AtributosViewResult {
  sistema: string;
  atributos: AtributoView[];
}

interface EquipamentoRaw {
  id?: number;
  nome?: string;
  descricao?: string;
  bonus?: Record<string, number | string> | null;
  [key: string]: unknown;
}

interface HistoriaRaw {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface UsePersonagemVerModelParams {
  navigate?: (path: string) => void;
}

/**
 * Monta a lista de atributos a exibir conforme o sistema do personagem.
 */
function montarAtributosView(personagem: PersonagemRaw | null): AtributosViewResult {
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
      const valor = mapa[key] ?? (personagem[key] as number | undefined) ?? 10;
      return { key, label, valor, modificador: formatModifier(getDnd5eModifier(valor)) };
    }),
  };
}

export const usePersonagemVerModel = ({ navigate }: UsePersonagemVerModelParams = {}) => {
  const { id } = useParams<{ id: string }>();

  // Core state
  const [personagem, setPersonagem] = useState<PersonagemRaw | null>(null);
  const [evolucao, setEvolucao] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Background generation
  const [gerandoBackground, setGerandoBackground] = useState(false);

  // Validation
  const [validacao, setValidacao] = useState<unknown>(null);
  const [validando, setValidando] = useState(false);

  // Point distribution
  const [distribuindo, setDistribuindo] = useState(false);
  const [pontosParaDistribuir, setPontosParaDistribuir] = useState<Record<string, number>>({});

  // Equipment / Inventory
  const [equipamentos, setEquipamentos] = useState<EquipamentoRaw[]>([]);
  const [catalogoEquipamentos, setCatalogoEquipamentos] = useState<EquipamentoRaw[]>([]);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<EquipamentoRaw | null>(null);

  // Audio background
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [gerandoAudio, setGerandoAudio] = useState(false);
  const audioUrlRef = useRef<string | null>(null);

  // Historias
  const [historiasDisponiveis, setHistoriasDisponiveis] = useState<HistoriaRaw[]>([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPersonagem = async (personagemId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await personagemService.getById(Number(personagemId)) as PersonagemRaw | { data?: PersonagemRaw };
      const data = (response as { data?: PersonagemRaw })?.data || (response as PersonagemRaw);
      setPersonagem(data);
      setLoading(false);

      // Load evolution and equipment in parallel
      loadEvolucao(personagemId);
      loadEquipamentos(personagemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar personagem';
      setError(message);
      setLoading(false);
    }
  };

  const loadEvolucao = async (personagemId: string | number) => {
    try {
      const data = await personagemService.obterEvolucao(Number(personagemId));
      setEvolucao(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Evolucao not available:', message);
    }
  };

  const gerarBackground = useCallback(async (sugestao: string = '') => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setGerandoBackground(true);
    try {
      const resultado = await personagemService.gerarBackground(personagemId, sugestao) as { background?: string } | null;
      if (resultado?.background) {
        setPersonagem(prev => prev ? ({
          ...prev,
          background: resultado.background ?? prev.background,
        }) : prev);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao gerar background: ${message}`);
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
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao validar: ${message}`);
    } finally {
      setValidando(false);
    }
  }, [personagem?.id]);

  // Keys de atributo validas para distribuir pontos, ja resolvidas por sistema.
  const pontosDistribuicaoAttrs = useMemo(
    () => atributosView.atributos.map(({ key, label }) => ({ key, label })),
    [atributosView]
  );

  const setPontoAtributo = useCallback((atributo: string, valor: number) => {
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
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao distribuir pontos: ${message}`);
    } finally {
      setDistribuindo(false);
    }
  }, [personagem?.id, pontosParaDistribuir, atributosView]);

  // Equipment methods
  const loadEquipamentos = async (personagemId?: string | number) => {
    const pid = personagemId || personagem?.id;
    if (!pid) return;

    setLoadingEquipamentos(true);
    try {
      const raw = await personagemService.listarEquipamentos(Number(pid)) as Array<{ equipamento?: EquipamentoRaw } & EquipamentoRaw> | null;
      const data = (raw || []).map(item => item.equipamento || item);
      setEquipamentos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Erro ao carregar equipamentos:', message);
      setEquipamentos([]);
    } finally {
      setLoadingEquipamentos(false);
    }
  };

  const loadCatalogo = async () => {
    try {
      const response = await equipamentoService.getAll() as { data?: EquipamentoRaw[] } | EquipamentoRaw[];
      const catalogo = (response as { data?: EquipamentoRaw[] })?.data || (response as EquipamentoRaw[]) || [];
      setCatalogoEquipamentos(Array.isArray(catalogo) ? catalogo : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Erro ao carregar catalogo:', message);
    }
  };

  const adicionarEquipamento = useCallback(async (equipamentoId: number) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingEquipamentos(true);
    try {
      await personagemService.adicionarEquipamento(personagemId, equipamentoId);
      await loadEquipamentos(personagemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao adicionar equipamento: ${message}`);
      setLoadingEquipamentos(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personagem?.id]);

  const removerEquipamento = useCallback(async (equipamentoId: number) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingEquipamentos(true);
    try {
      await personagemService.removerEquipamento(personagemId, equipamentoId);
      await loadEquipamentos(personagemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao remover equipamento: ${message}`);
      setLoadingEquipamentos(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!equipamentos?.length) return {} as Record<string, number>;

    const totais: Record<string, number> = {};
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
      const response = await historiaService.getAll() as HistoriaRaw[] | { data?: HistoriaRaw[] };
      const historias = Array.isArray(response) ? response : (response as { data?: HistoriaRaw[] })?.data || [];
      setHistoriasDisponiveis(historias);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('Erro ao carregar historias:', message);
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

  const vincularHistoria = useCallback(async (historiaId: number | string) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingHistorias(true);
    try {
      await personagemService.vincularHistoria(personagemId, Number(historiaId));
      await loadPersonagem(personagemId);
      setMostrarSeletorHistoria(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao vincular historia: ${message}`);
    } finally {
      setLoadingHistorias(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personagem?.id]);

  const desvincularHistoria = useCallback(async (historiaId: number | string) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;

    setLoadingHistorias(true);
    try {
      await personagemService.desvincularHistoria(personagemId, Number(historiaId));
      await loadPersonagem(personagemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao desvincular historia: ${message}`);
    } finally {
      setLoadingHistorias(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personagem?.id]);

  const historiasNaoVinculadas = useMemo(() => {
    const idsVinculados = new Set((personagem?.historias || []).map(h => h.id));
    return historiasDisponiveis.filter(h => !idsVinculados.has(h.id));
  }, [historiasDisponiveis, personagem?.historias]);

  // Imagem handler
  const handleImagemGenerated = useCallback(async (url: string) => {
    const personagemId = personagem?.id;
    if (!personagemId) return;
    try {
      await personagemService.update(personagemId, { imagem: url });
      setPersonagem(prev => prev ? ({ ...prev, imagem: url }) : prev);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar imagem';
      setError(message);
    }
  }, [personagem?.id]);

  const gerarAudioBackground = useCallback(async () => {
    const text = personagem?.background;
    const speechText = sanitizeTextForSpeech(text || '');
    if (!speechText || gerandoAudio) return;

    setGerandoAudio(true);
    try {
      const response = await apiClient.post('/tts/generate', {
        text: speechText,
        provider: 'opensource',
        voiceId: 'pt-br-kokoro-santa',
      }, { responseType: 'blob' });

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const blob = response instanceof Blob ? response : new Blob([response as BlobPart], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Erro ao gerar audio: ${message}`);
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

export type PersonagemVerModel = ReturnType<typeof usePersonagemVerModel>;
