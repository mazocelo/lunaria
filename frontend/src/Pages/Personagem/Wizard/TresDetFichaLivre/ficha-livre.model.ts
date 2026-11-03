import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const NIVEL_PODER: Record<string, number> = {
  novato: 5,
  lutador: 7,
  campeao: 10,
  lenda: 12,
};

const MAX_ATTR: Record<string, number> = {
  novato: 3,
  lutador: 4,
  campeao: 5,
  lenda: 5,
};

interface TierLimit {
  maxVantagens: number;
  maxDesvantagemPts: number;
}

const TIER_LIMITS: Record<string, TierLimit> = {
  novato:  { maxVantagens: 2, maxDesvantagemPts: -4 },
  lutador: { maxVantagens: 3, maxDesvantagemPts: -5 },
  campeao: { maxVantagens: 4, maxDesvantagemPts: -6 },
  lenda:   { maxVantagens: 5, maxDesvantagemPts: -6 },
};

const FOCUS_KEYS = ['fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'] as const;
const CHAR_KEYS = ['F', 'H', 'R', 'A', 'PdF'] as const;
const DRAFT_KEY = 'lunaria_3det_ficha_draft_v1';

type CharKey = typeof CHAR_KEYS[number];
type FocusKey = typeof FOCUS_KEYS[number];

interface CatalogoItem {
  id?: number | string;
  nome?: string;
  custo?: number;
  tipo?: string | string[];
  subtipo?: string;
  focus_requisito?: Array<Record<string, number>>;
  [key: string]: unknown;
}

interface UseTresDetFichaModelParams {
  navigate: (path: string) => void;
}

export function useTresDetFichaModel({ navigate }: UseTresDetFichaModelParams) {
  // ---- Core state ----
  const [nome, setNome] = useState('');
  const [nivelPoder, setNivelPoder] = useState('lutador');
  const [caracteristicas, setCaracteristicas] = useState<Record<CharKey, number>>({ F: 0, H: 0, R: 0, A: 0, PdF: 0 });
  const [vantagensIds, setVantagensIds] = useState<string[]>([]);
  const [desvantagensIds, setDesvantagensIds] = useState<string[]>([]);
  const [focus, setFocus] = useState<Record<FocusKey, number>>({ fogo: 0, agua: 0, terra: 0, ar: 0, luz: 0, trevas: 0 });
  const [historia, setHistoria] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Catalog data (fetched once) ----
  const [vantagensCatalogo, setVantagensCatalogo] = useState<CatalogoItem[]>([]);
  const [desvantagensCatalogo, setDesvantagensCatalogo] = useState<CatalogoItem[]>([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);
  const [magiasIds, setMagiasIds] = useState<string[]>([]);
  const [magiasCatalogo, setMagiasCatalogo] = useState<CatalogoItem[]>([]);
  const [equipamentosIds, setEquipamentosIds] = useState<string[]>([]);
  const [itensCatalogo, setItensCatalogo] = useState<CatalogoItem[]>([]);

  // ---- Pool computations ----
  const pontosTotal = NIVEL_PODER[nivelPoder] || 7;
  const maxAttr = MAX_ATTR[nivelPoder] || 3;

  const pontosCaracteristicas = useMemo(
    () => CHAR_KEYS.reduce((sum, k) => sum + caracteristicas[k], 0),
    [caracteristicas],
  );

  const pontosVantagens = useMemo(
    () => vantagensIds.reduce((sum, id) => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return sum + (v?.custo || 0);
    }, 0),
    [vantagensIds, vantagensCatalogo],
  );

  const pontosDesvantagens = useMemo(
    () => desvantagensIds.reduce((sum, id) => {
      const d = desvantagensCatalogo.find(x => String(x.id) === String(id));
      return sum + (d?.custo || 0); // custo is negative
    }, 0),
    [desvantagensIds, desvantagensCatalogo],
  );

  const pontosFocus = useMemo(
    () => FOCUS_KEYS.reduce((sum, k) => sum + focus[k], 0),
    [focus],
  );

  const pontosUsados = pontosCaracteristicas + pontosVantagens + pontosFocus;
  const pontosRestantes = pontosTotal + pontosDesvantagens - pontosUsados;

  // ---- Tier limits ----
  const tierLimits = TIER_LIMITS[nivelPoder] || TIER_LIMITS.lutador;

  const vantagensContaveis = useMemo(
    () => vantagensIds.filter(id => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return v?.subtipo !== 'racial';
    }).length,
    [vantagensIds, vantagensCatalogo],
  );

  const limiteVantagensAtingido = vantagensContaveis >= tierLimits.maxVantagens;
  const limiteDesvantagensAtingido = pontosDesvantagens <= tierLimits.maxDesvantagemPts;

  // ---- Magic detection ----
  const temMagia = useMemo(
    () => vantagensIds.some(id => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return v?.tipo === 'magico' || (Array.isArray(v?.tipo) && v.tipo.includes('magico'));
    }),
    [vantagensIds, vantagensCatalogo],
  );

  const magiasDisponiveis = useMemo(
    () => magiasCatalogo.filter(m => {
      if (!m.focus_requisito || !Array.isArray(m.focus_requisito)) return true;
      return m.focus_requisito.every((req: Record<string, number>) => {
        const key = Object.keys(req)[0] as FocusKey;
        return (focus[key] || 0) >= req[key];
      });
    }),
    [magiasCatalogo, focus],
  );

  // ---- Derived stats ----
  const pv = 5 * caracteristicas.R;
  const pm = temMagia ? 5 * Math.max(caracteristicas.H, caracteristicas.PdF) : 0;

  // ---- Setters with pool guard ----
  const setCaracteristica = useCallback((key: CharKey, valor: number) => {
    if (valor < 0 || valor > maxAttr) return;
    setCaracteristicas(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes, maxAttr]);

  const setFocusNivel = useCallback((key: FocusKey, valor: number) => {
    if (valor < 0 || valor > maxAttr) return;
    setFocus(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes, maxAttr]);

  const adicionarVantagem = useCallback((id: number | string) => {
    const sid = String(id);
    if (vantagensIds.includes(sid)) return;
    const v = vantagensCatalogo.find(x => String(x.id) === sid);
    if (v && (v.custo ?? 0) > pontosRestantes) return;

    if (v?.subtipo === 'racial') {
      const jaTemRacial = vantagensIds.some(vid => {
        const vt = vantagensCatalogo.find(x => String(x.id) === vid);
        return vt?.subtipo === 'racial';
      });
      if (jaTemRacial) return;
    } else if (vantagensContaveis >= tierLimits.maxVantagens) {
      return;
    }

    setVantagensIds(prev => [...prev, sid]);
  }, [vantagensIds, vantagensCatalogo, pontosRestantes, vantagensContaveis, tierLimits]);

  const removerVantagem = useCallback((id: number | string) => {
    const sid = String(id);
    setVantagensIds(prev => prev.filter(x => x !== sid));
  }, []);

  const adicionarDesvantagem = useCallback((id: number | string) => {
    const sid = String(id);
    if (desvantagensIds.includes(sid)) return;
    const d = desvantagensCatalogo.find(x => String(x.id) === sid);
    if (d && pontosDesvantagens + (d.custo ?? 0) < tierLimits.maxDesvantagemPts) return;
    setDesvantagensIds(prev => [...prev, sid]);
  }, [desvantagensIds, desvantagensCatalogo, pontosDesvantagens, tierLimits]);

  const removerDesvantagem = useCallback((id: number | string) => {
    setDesvantagensIds(prev => prev.filter(x => x !== String(id)));
  }, []);

  const adicionarMagia = useCallback((id: number | string) => {
    const sid = String(id);
    if (magiasIds.includes(sid)) return;
    setMagiasIds(prev => [...prev, sid]);
  }, [magiasIds]);

  const removerMagia = useCallback((id: number | string) => {
    setMagiasIds(prev => prev.filter(x => x !== String(id)));
  }, []);

  const adicionarEquipamento = useCallback((id: number | string) => {
    const sid = String(id);
    if (equipamentosIds.includes(sid)) return;
    setEquipamentosIds(prev => [...prev, sid]);
  }, [equipamentosIds]);

  const removerEquipamento = useCallback((id: number | string) => {
    setEquipamentosIds(prev => prev.filter(x => x !== String(id)));
  }, []);

  // ---- Nível de Poder change with auto-trim ----
  const mudarNivelPoder = useCallback((novoNivel: string) => {
    setNivelPoder(novoNivel);
    const novoTotal = NIVEL_PODER[novoNivel] || 7;

    // Use functional updates to auto-trim if over budget
    setFocus(prevFocus => {
      setCaracteristicas(prevChars => {
        setVantagensIds(prevVant => {
          const calcUsed = (c: Record<CharKey, number>, f: Record<FocusKey, number>, v: string[]) => {
            const charPts = CHAR_KEYS.reduce<number>((s, k) => s + c[k], 0);
            const focusPts = FOCUS_KEYS.reduce<number>((s, k) => s + f[k], 0);
            const vantPts = v.reduce<number>((s, id) => {
              const vt = vantagensCatalogo.find(x => String(x.id) === id);
              return s + (vt?.custo || 0);
            }, 0);
            return charPts + focusPts + vantPts;
          };

          const c = { ...prevChars };
          const f = { ...prevFocus };
          const v = [...prevVant];

          // Trim Focus first (highest value first)
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal) {
            const maxKey = FOCUS_KEYS.reduce<FocusKey>((best, k) => f[k] > f[best] ? k : best, FOCUS_KEYS[0]);
            if (f[maxKey] <= 0) break;
            f[maxKey]--;
          }

          // Trim Characteristics (PdF -> A -> R -> H -> F)
          const charOrder: CharKey[] = ['PdF', 'A', 'R', 'H', 'F'];
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal) {
            const key = charOrder.find(k => c[k] > 0);
            if (!key) break;
            c[key]--;
          }

          // Trim Vantagens (last added first)
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal && v.length > 0) {
            v.pop();
          }

          // Apply trimmed state
          setCaracteristicas(c);
          setFocus(f);
          return v;
        });
        return prevChars; // Will be overwritten above
      });
      return prevFocus; // Will be overwritten above
    });
  }, [vantagensCatalogo, pontosDesvantagens]);

  // ---- Draft persistence ----
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.nome) setNome(draft.nome);
      if (draft.nivelPoder) setNivelPoder(draft.nivelPoder);
      if (draft.caracteristicas) setCaracteristicas(draft.caracteristicas);
      if (draft.vantagensIds) setVantagensIds(draft.vantagensIds);
      if (draft.desvantagensIds) setDesvantagensIds(draft.desvantagensIds);
      if (draft.focus) setFocus(draft.focus);
      if (draft.historia) setHistoria(draft.historia);
      if (draft.magiasIds) setMagiasIds(draft.magiasIds);
      if (draft.equipamentosIds) setEquipamentosIds(draft.equipamentosIds);
    } catch { /* ignore corrupt draft */ }
  }, []);

  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = { nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia, magiasIds, equipamentosIds };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1000);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia, magiasIds, equipamentosIds]);

  const limparDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // Remove magias cujo focus deixou de cumprir o requisito apos mudanca de focus.
  useEffect(() => {
    if (magiasCatalogo.length === 0) return;
    setMagiasIds(prev => prev.filter(id => {
      const m = magiasCatalogo.find(x => String(x.id) === id);
      if (!m?.focus_requisito) return true;
      return m.focus_requisito.every((req: Record<string, number>) => {
        const key = Object.keys(req)[0] as FocusKey;
        return (focus[key] || 0) >= req[key];
      });
    }));
  }, [focus, magiasCatalogo]);

  // ---- Validation ----
  const podeCriar = nome.trim().length > 0 && pontosRestantes >= 0;

  return {
    // State
    nome, setNome,
    nivelPoder, mudarNivelPoder,
    caracteristicas, setCaracteristica,
    vantagensIds, adicionarVantagem, removerVantagem,
    desvantagensIds, adicionarDesvantagem, removerDesvantagem,
    magiasIds, adicionarMagia, removerMagia,
    equipamentosIds, adicionarEquipamento, removerEquipamento,
    focus, setFocusNivel,
    historia, setHistoria,
    // Pool
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosUsados, pontosRestantes,
    // Derived
    temMagia, magiasDisponiveis, pv, pm, podeCriar, maxAttr,
    tierLimits, vantagensContaveis, limiteVantagensAtingido, limiteDesvantagensAtingido,
    // Catalog
    vantagensCatalogo, desvantagensCatalogo, catalogoLoading,
    setVantagensCatalogo, setDesvantagensCatalogo, setCatalogoLoading,
    magiasCatalogo, setMagiasCatalogo,
    itensCatalogo, setItensCatalogo,
    // Actions
    salvando, setSalvando, error, setError, limparDraft,
    navigate,
  };
}

export type TresDetFichaModel = ReturnType<typeof useTresDetFichaModel>;
