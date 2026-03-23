import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const NIVEL_PODER = {
  novato: 5,
  lutador: 7,
  campeao: 10,
  lenda: 12,
};

const MAX_ATTR = {
  novato: 3,
  lutador: 3,
  campeao: 4,
  lenda: 4,
};

const FOCUS_KEYS = ['fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];
const CHAR_KEYS = ['F', 'H', 'R', 'A', 'PdF'];
const DRAFT_KEY = 'lunaria_3det_ficha_draft_v1';

export function useTresDetFichaModel({ navigate }) {
  // ---- Core state ----
  const [nome, setNome] = useState('');
  const [nivelPoder, setNivelPoder] = useState('lutador');
  const [caracteristicas, setCaracteristicas] = useState({ F: 0, H: 0, R: 0, A: 0, PdF: 0 });
  const [vantagensIds, setVantagensIds] = useState([]);
  const [desvantagensIds, setDesvantagensIds] = useState([]);
  const [focus, setFocus] = useState({ fogo: 0, agua: 0, terra: 0, ar: 0, luz: 0, trevas: 0 });
  const [historia, setHistoria] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState(null);

  // ---- Catalog data (fetched once) ----
  const [vantagensCatalogo, setVantagensCatalogo] = useState([]);
  const [desvantagensCatalogo, setDesvantagensCatalogo] = useState([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);

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

  // ---- Magic detection ----
  const temMagia = useMemo(
    () => vantagensIds.some(id => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return v?.tipo === 'magico' || (Array.isArray(v?.tipo) && v.tipo.includes('magico'));
    }),
    [vantagensIds, vantagensCatalogo],
  );

  // ---- Derived stats ----
  const pv = 5 * caracteristicas.R;
  const pm = temMagia ? 5 * Math.max(caracteristicas.H, caracteristicas.PdF) : 0;

  // ---- Setters with pool guard ----
  const setCaracteristica = useCallback((key, valor) => {
    if (valor < 0 || valor > maxAttr) return;
    setCaracteristicas(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes, maxAttr]);

  const setFocusNivel = useCallback((key, valor) => {
    if (valor < 0 || valor > maxAttr) return;
    setFocus(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes, maxAttr]);

  const adicionarVantagem = useCallback((id) => {
    const sid = String(id);
    if (vantagensIds.includes(sid)) return;
    const v = vantagensCatalogo.find(x => String(x.id) === sid);
    if (v && v.custo > pontosRestantes) return;
    setVantagensIds(prev => [...prev, sid]);
  }, [vantagensIds, vantagensCatalogo, pontosRestantes]);

  const removerVantagem = useCallback((id) => {
    const sid = String(id);
    setVantagensIds(prev => prev.filter(x => x !== sid));
    // If removing last magic advantage, clear focus
    const remaining = vantagensIds.filter(x => x !== sid);
    const stillHasMagia = remaining.some(vid => {
      const v = vantagensCatalogo.find(x => String(x.id) === vid);
      return v?.tipo === 'magico' || (Array.isArray(v?.tipo) && v.tipo.includes('magico'));
    });
    if (!stillHasMagia) {
      setFocus({ fogo: 0, agua: 0, terra: 0, ar: 0, luz: 0, trevas: 0 });
    }
  }, [vantagensIds, vantagensCatalogo]);

  const adicionarDesvantagem = useCallback((id) => {
    const sid = String(id);
    if (desvantagensIds.includes(sid)) return;
    setDesvantagensIds(prev => [...prev, sid]);
  }, [desvantagensIds]);

  const removerDesvantagem = useCallback((id) => {
    setDesvantagensIds(prev => prev.filter(x => x !== String(id)));
  }, []);

  // ---- Nível de Poder change with auto-trim ----
  const mudarNivelPoder = useCallback((novoNivel) => {
    setNivelPoder(novoNivel);
    const novoTotal = NIVEL_PODER[novoNivel] || 7;

    // Use functional updates to auto-trim if over budget
    setFocus(prevFocus => {
      setCaracteristicas(prevChars => {
        setVantagensIds(prevVant => {
          const calcUsed = (c, f, v) => {
            const charPts = CHAR_KEYS.reduce((s, k) => s + c[k], 0);
            const focusPts = FOCUS_KEYS.reduce((s, k) => s + f[k], 0);
            const vantPts = v.reduce((s, id) => {
              const vt = vantagensCatalogo.find(x => String(x.id) === id);
              return s + (vt?.custo || 0);
            }, 0);
            return charPts + focusPts + vantPts;
          };

          let c = { ...prevChars };
          let f = { ...prevFocus };
          let v = [...prevVant];

          // Trim Focus first (highest value first)
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal) {
            const maxKey = FOCUS_KEYS.reduce((best, k) => f[k] > f[best] ? k : best, FOCUS_KEYS[0]);
            if (f[maxKey] <= 0) break;
            f[maxKey]--;
          }

          // Trim Characteristics (PdF -> A -> R -> H -> F)
          const charOrder = ['PdF', 'A', 'R', 'H', 'F'];
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
  const draftTimerRef = useRef(null);

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
    } catch { /* ignore corrupt draft */ }
  }, []);

  useEffect(() => {
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = { nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1000);
    return () => clearTimeout(draftTimerRef.current);
  }, [nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia]);

  const limparDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // ---- Validation ----
  const podeCriar = nome.trim().length > 0 && pontosRestantes >= 0;

  return {
    // State
    nome, setNome,
    nivelPoder, mudarNivelPoder,
    caracteristicas, setCaracteristica,
    vantagensIds, adicionarVantagem, removerVantagem,
    desvantagensIds, adicionarDesvantagem, removerDesvantagem,
    focus, setFocusNivel,
    historia, setHistoria,
    // Pool
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosUsados, pontosRestantes,
    // Derived
    temMagia, pv, pm, podeCriar, maxAttr,
    // Catalog
    vantagensCatalogo, desvantagensCatalogo, catalogoLoading,
    setVantagensCatalogo, setDesvantagensCatalogo, setCatalogoLoading,
    // Actions
    salvando, setSalvando, error, setError, limparDraft,
    navigate,
  };
}
